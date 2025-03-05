import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { postLiked, PostService } from '../../services/post.service';
import { TimeAgoPipe } from '../../time-ago.pipe';
import { Observable, of } from 'rxjs';
import { TINYMCE_SCRIPT_SRC, EditorComponent } from '@tinymce/tinymce-angular';
import { TINYMCE_DEFAULT_CONFIG } from '../../utils/editor-config';
import { Editor } from 'tinymce';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';


// Add this interface at the top of the file
interface Post {
  id: number;
  titre: string;
  description: string;
  image?: string;
  imageUrl?: string;
  link?: string;
  isLiked?: boolean;
  formattedDate?: string;
  createdAt?: string;
}

interface NewPost {
  titre: string;
  description: string;
  link?: string;
  image?: any;
}


interface Comment {
  id: number;
  nom: string;
  prenom: string;
  commentaire: string;
  createdAt: string;
}

declare const tinymce: any;

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [
    EditorComponent,
    NgFor,
    NgIf,
    NgClass,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    TimeAgoPipe
],
  providers: [
    { provide: TINYMCE_SCRIPT_SRC, useValue: '/tinymce/tinymce.min.js' },
  ],
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.css']
})
export class PostsComponent {
  private editorInstance: Editor | null = null;
  posts: Post[] = [];
  comments: { [key: number]: Comment[] } = {};
  newPost: { titre: string; description: string; link?: string; image?: any } = { 
    titre: '', 
    description: '' 
  };
  safeDescription: SafeHtml = '';
  token: string | null = '';
  newComment: string = '';
  editingPost: Post | null = null;
  isPostModalOpen: boolean = false;
  postliked: postLiked[] | null = null;
  tinymceInit: EditorComponent['init'] = {
    ...TINYMCE_DEFAULT_CONFIG,
    height: 200,
    setup: (editor: Editor) => {
      this.editorInstance = editor;
  
      editor.on('input change', () => {
        this.newPost.description = editor.getContent(); // Update the description
      });
    },
  };
  


  openModal() {
    this.isPostModalOpen = true;
  }

  closeModal() {
    this.isPostModalOpen = false;
  }

// toggleLike(post: Post) {


//   if (post.isLiked) {
//     this.unlikePost(post.id);
//       // Call API to like
//   } else {
//     this.likePost(post.id);// Call API to unlike
//   }
// }

  toggleLike(post: Post) {
    if (post.isLiked) {
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
        // Update UI immediately
        post.isLiked = true;

        // Optional: Show a non-modal notification instead of alert
        // e.g., use a toast notification or just console.log
        console.log(response.message);
      },
      error: (error) => console.error('Error liking post:', error),
    });
  }

  unlikePost(post: Post) {
    if (!this.token) {
      alert('Please log in to unlike a post');
      return;
    }

    this.postService.unlikePost(post.id, this.token).subscribe({
      next: (response) => {
        // Update UI immediately
        post.isLiked = false;

        // Optional: Show a non-modal notification instead of alert
        console.log(response.message);
      },
      error: (error) => console.error('Error unliking post:', error),
    });
  }

  constructor(private http: HttpClient, public userService: UserService, public postService: PostService, private sanitizer: DomSanitizer) {
    this.fetchPosts();
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

  fetchPosts() {
    this.getLikes().subscribe({
      next: (response) => {
        this.postliked = response;
      },
      error: (error) => {
        console.error("Error fetching posts:", error);
      },
    });

    this.token = this.userService.getToken();

    if (this.token && this.token !== "") {
      this.postService.getPostsByUserId(this.token).subscribe({
        next: (response) => {
          this.posts = response.map((post: Post) => {
            if (post.image) {
              post.imageUrl = `http://localhost:3000/${post.image}`;
            }

            // Set isLiked based on whether this post's id is in postliked
            post.isLiked = this.postliked?.some((likedPost) => likedPost.postId === post.id) || false;

            this.loadComments(post.id); // Load comments for each post
            return post;
          });
        },
        error: (error) => {
          console.error("Error fetching posts:", error);
        },
      });
    } else {
      console.log("User not logged in!");
    }
  }

  addPost() {
    this.token = this.userService.getToken();
  
    if (this.token && this.token !== '') {
      console.log('Post being sent:', this.newPost); // Debugging line
  
      this.postService.createPost(this.newPost, this.token).subscribe({
        next: (response) => {
          alert(response.message); // Show success message
          this.newPost = { titre: '', description: '', link: '', image: undefined }; // Reset form
          this.editorInstance?.setContent(''); // Clear TinyMCE editor
          this.fetchPosts(); // Refresh posts list
        },
        error: (error) => {
          console.error('Error creating post:', error);
          alert('Failed to add post');
        },
      });
    } else {
      console.log('User not logged in');
      alert('Please log in to add a post');
    }
  }
  

  deletePost(id: number) {
    this.token = this.userService.getToken();

    if (this.token && this.token !== '') {
      this.postService.deletePost(id, this.token).subscribe({
        next: (response) => {
          alert(response.message); // "Post supprimé"
          this.fetchPosts();
        },
        error: (error) => {
          console.error('Error deleting post:', error);
          alert('Failed to delete post');
        },
      });
    } else {
      console.log('User not logged in');
      alert('Please log in to delete a post');
    }
  }

  startEditing(post: Post) {
    this.editingPost = { ...post };
  }

  updatePost() {
    if (!this.editingPost || !this.token) {
      alert('No post selected or not logged in');
      return;
    }

    const updatedPost: NewPost = {
      titre: this.editingPost.titre,
      description: this.editingPost.description,
      link: this.editingPost.link,
    };

    this.postService.updatePost(this.editingPost.id, updatedPost, this.token).subscribe({
      next: (response) => {
        alert(response.message); // "Post mis à jour avec succès"
        this.editingPost = null;
        this.fetchPosts();
      },
      error: (error) => {
        console.error('Error updating post:', error);
        alert('Failed to update post');
      },
    });
  }

  // likePost(postId: number) {
  //   if (!this.token) {
  //     alert('Please log in to like a post');
  //     return;
  //   }
  //   this.postService.likePost(postId, this.token).subscribe({
  //     next: (response) => {
  //       alert(response.message)
  //     window.location.reload();
  //     },
  //     error: (error) => console.error('Error liking post:', error),
  //   });
  // }

  // unlikePost(postId: number) {
  //   if (!this.token) {
  //     alert('Please log in to unlike a post');
  //     return;
  //   }
  //   this.postService.unlikePost(postId, this.token).subscribe({
  //     next: (response) => alert(response.message),
  //     error: (error) => console.error('Error unliking post:', error),
  //   });
  // }

  // favouritePost(postId: number) {
  //   if (!this.token) {
  //     alert('Please log in to favorite a post');
  //     return;
  //   }
  //   this.postService.favouritePost(postId, this.token).subscribe({
  //     next: (response) => alert(response.message),
  //     error: (error) => console.error('Error favoriting post:', error),
  //   });
  // }

  // unfavouritePost(postId: number) {
  //   if (!this.token) {
  //     alert('Please log in to unfavorite a post');
  //     return;
  //   }
  //   this.postService.unfavouritePost(postId, this.token).subscribe({
  //     next: (response) => alert(response.message),
  //     error: (error) => console.error('Error unfavoriting post:', error),
  //   });
  // }

  // Fetch comments for a specific post
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

  newComments: { [key: number]: string } = {}; // Object to store comments per post

addComment(postId: number) {
  if (!this.token || !this.newComments[postId]) {
    alert('Please log in and enter a comment');
    return;
  }

  this.postService.addComment(postId, this.newComments[postId], this.token).subscribe({
    next: (response) => {
      alert(response.message);
      this.newComments[postId] = ''; // Clear comment only for that specific post
    },
    error: (error) => console.error('Error adding comment:', error),
  });
}


  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.newPost.image = file;
    }
  }

  cancelPost() {
    this.newPost = { 
      titre: '', 
      description: '', 
      link: undefined, 
      image: undefined 
    };
  }
}