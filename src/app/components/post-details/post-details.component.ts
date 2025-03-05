import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { PostService, Post as ServicePost } from '../../services/post.service';
import { TimeAgoPipe } from '../../time-ago.pipe';

interface Post extends ServicePost {
  imageUrl?: string;
  formattedDate?: string;
  isLikedByUser?: number;  // Make optional since API might not include it
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
  selector: 'app-post-details',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, TimeAgoPipe],
  templateUrl: './post-details.component.html',
  styleUrls: ['./post-details.component.css']
})
export class PostDetailsComponent {
  post: Post = {
    id: 0,
    titre: '',
    description: '',
    isLikedByUser: 0 // Default initialization
  } as Post;
  comments: Comment[] = [];
  newComment: string = '';
  token: string | null = '';

  constructor(
    private route: ActivatedRoute,
    public userService: UserService,
    public postService: PostService
  ) {
    this.token = this.userService.getToken();
    const postId = Number(this.route.snapshot.params['id']);
    if (postId) {
      this.fetchPost(postId);
    }
  }

  fetchPost(id: number) {
    this.postService.getPostById(id).subscribe({
      next: (data: Post) => {
        console.log('Fetched post:', data); // Debug log
        this.post = {
          ...data,
          imageUrl: data.image ? `http://localhost:3000/${data.image}` : undefined,
          formattedDate: this.formatDate(data.createdAt),
          isLikedByUser: data.isLikedByUser || 0 // Ensure default
        };
        this.loadComments(id);
      },
      error: (error) => console.error('Error fetching post:', error)
    });
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  loadComments(postId: number) {
    this.postService.getPostComments(postId).subscribe({
      next: (comments: Comment[]) => {
        this.comments = comments;
      },
      error: (error) => console.error('Error loading comments:', error)
    });
  }

  toggleLike() {
    if (!this.token) {
      alert('Please log in to like a post');
      return;
    }
    if (this.post.isLikedByUser === 1) {
      this.unlikePost();
    } else {
      this.likePost();
    }
  }

  likePost() {
    if (!this.token) return;
    this.postService.likePost(this.post.id, this.token).subscribe({
      next: (response) => {
        this.post.isLikedByUser = 1;
        this.post.likeCount = (this.post.likeCount || 0) + 1;
        console.log(response.message);
      },
      error: (error) => {
        console.error('Error liking post:', error);
        if (error.status === 409) console.log('Post already liked');
      }
    });
  }

  unlikePost() {
    if (!this.token) return;
    this.postService.unlikePost(this.post.id, this.token).subscribe({
      next: (response) => {
        this.post.isLikedByUser = 0;
        this.post.likeCount = Math.max((this.post.likeCount || 0) - 1, 0);
        console.log(response.message);
      },
      error: (error) => console.error('Error unliking post:', error)
    });
  }

  addComment() {
    if (!this.token || !this.newComment) {
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
      commentaire: this.newComment,
      createdAt: new Date().toISOString()
    };
    this.comments.unshift(tempComment);
    const commentText = this.newComment;
    this.newComment = '';

    this.postService.addComment(this.post.id, commentText, this.token).subscribe({
      next: (response) => {
        console.log('Comment added:', response.message);
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        const tempIndex = this.comments.findIndex(c => c.id === tempComment.id);
        if (tempIndex !== -1) this.comments.splice(tempIndex, 1);
        this.newComment = commentText;
        alert('Failed to add comment');
      }
    });
  }
}