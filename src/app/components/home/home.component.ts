import { Component } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { Router} from '@angular/router';
import { UserService } from '../../services/user.service';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { PostService } from '../../services/post.service';
import { TimeAgoPipe } from '../../time-ago.pipe';
import { Observable, of } from 'rxjs';
import { postLiked } from '../../services/post.service';

// Add this interface at the top of the file
interface Post {
  id: number;
  titre: string;
  description: string;
  image?: string;
  imageUrl?: string;
  link?: string;
  createdAt?: string;
  nom?: string;
  prenom?: string;
  formattedDate?: string;
  isLikedByUser?: number;  // 0 or 1
  likeCount?: number;
}

interface Comment {
  id: number;
  nom: string;
  prenom: string;
  commentaire: string;
  createdAt: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    NgClass,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    TimeAgoPipe
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  posts: Post[] = [];
  comments: { [key: number]: Comment[] } = {};
  showComments: { [key: number]: boolean } = {};
  token: string | null = '';
  newComment: string = '';
  postliked: postLiked[] | null = null;



  toggleLike(post: Post) {
    if (!this.token) {
      alert('Please log in to like a post');
      return;
    }
    
    if (post.isLikedByUser) {
      this.unlikePost(post); // Pass the post object instead of just the ID
    } else {
      this.likePost(post); // Pass the post object instead of just the ID
    }
  }

  likePost(post: Post) {
    if (!this.token) {
      alert('Please log in to like a post');
      return;
    }
  
    this.postService.likePost(post.id, this.token).subscribe({
      next: (response) => {
        post.isLikedByUser = 1;
        post.likeCount = (post.likeCount || 0) + 1; // Increment likeCount
        console.log(response.message);
      },
      error: (error) => {
        console.error('Error liking post:', error);
        if (error.status === 409) { // Conflict (already liked)
          console.log('Post already liked by this user');
        }
      }
    });
  }
  
  unlikePost(post: Post) {
    if (!this.token) {
      alert('Please log in to unlike a post');
      return;
    }
  
    this.postService.unlikePost(post.id, this.token).subscribe({
      next: (response) => {
        post.isLikedByUser = 0;
        post.likeCount = Math.max((post.likeCount || 0) - 1, 0); // Decrement likeCount, min 0
        console.log(response.message);
      },
      error: (error) => console.error('Error unliking post:', error),
    });
  }

  constructor(
    private http: HttpClient, 
    public userService: UserService, 
    public postService: PostService,
    private router: Router
  ) {
    this.fetchAllPosts();
  }

  navigateToPost(postId: number) {
    console.log('Navigating to post:', postId); // Debug log
    this.router.navigate(['/post', postId]);
  }

  getLikes(): Observable<postLiked[] | null> {
    this.token = this.userService.getToken();
    if (this.token && this.token !== '' ){
      return this.postService.postLiked(this.token);
    }
    else {
      return of(null);
    }
  }

  fetchAllPosts() {
    this.token = this.userService.getToken();
  
    this.postService.getActivePosts("accepted").subscribe({
      next: (response) => {
        this.posts = response.list.map((post: Post) => {
          if (post.image) {
            post.imageUrl = `http://localhost:3000/${post.image}`;
          }
          post.formattedDate = this.formatDate(post.createdAt);
          // Set isLikedByUser based on the numeric value from API
          post.isLikedByUser = post.isLikedByUser || 0;  // Default to 0
  
          this.loadComments(post.id);
          this.showComments[post.id] = false; // Hide comments by default
          return post;
        });
  
        // If user is logged in, override isLiked with their specific like status
        if (this.token && this.token !== '') {
          this.getLikes().subscribe({
            next: (likedPosts) => {
              this.postliked = likedPosts || [];
              this.posts.forEach((post) => {
                // Check if the current user liked the post
                const userLiked = this.postliked!.some((likedPost) => likedPost.postId === post.id);
                // Set isLikedByUser to 1 if user liked it or if it has likes
                post.isLikedByUser = userLiked || (post.likeCount && post.likeCount > 0) ? 1 : 0;
              });
            },
            error: (error) => {
              console.error('Error fetching liked posts:', error);
            }
          });
        }
      },
      error: (error) => {
        console.error('Error fetching posts:', error);
      }
    });
  }
  
  // Function to format the date in French
  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  loadComments(postId: number) {
    this.postService.getPostComments(postId).subscribe({
      next: (comments: Comment[]) => {
        this.comments[postId] = comments;
      },
      error: (error) => {
        console.error('Error loading comments:', error);
      }
    });
  }

  toggleComments(postId: number) {
    this.showComments[postId] = !this.showComments[postId]; // Toggle visibility
  }

  newComments: { [key: number]: string } = {}; // Object to store comments per post

  addComment(postId: number) {
    if (!this.token || !this.newComments[postId]) {
      alert('Please log in and enter a comment');
      return;
    }

    const user = this.userService.getUser();
    if (!user) {
      alert('Please log in to comment');
      return;
    }

    const tempComment: Comment = {
      id: Date.now(),
      nom: user.nom,
      prenom: user.prenom,
      commentaire: this.newComments[postId],
      createdAt: new Date().toISOString()
    };

    // Optimistically add the comment to the UI
    if (!this.comments[postId]) {
      this.comments[postId] = [];
    }
    this.comments[postId].unshift(tempComment); // Add to the top of the list
    const commentText = this.newComments[postId];
    this.newComments[postId] = ''; // Clear the input immediately

    // Send the comment to the server
    this.postService.addComment(postId, commentText, this.token).subscribe({
      next: (response) => {
        // Keep the optimistically added comment since server only returns success message
        alert('Comment added successfully');
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        // Rollback on error
        const tempIndex = this.comments[postId].findIndex(c => c.id === tempComment.id);
        if (tempIndex !== -1) {
          this.comments[postId].splice(tempIndex, 1);
        }
        this.newComments[postId] = commentText;
        alert('Failed to add comment. Please try again.');
      }
    });
  }

}