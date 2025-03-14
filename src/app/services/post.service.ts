import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserService } from './user.service';

// Define the Post interface to match your backend model
export interface Post {
  id: number;
  titre: string;
  description: string;
  userId: number;
  image?: string; // Optional, as it can be null
  link?: string;  // Optional, as it can be null
  nom?: string;   // From JOIN with users table in getPostById
  prenom?: string;
  createdAt?: string; // From JOIN with users table in getPostById
}

// Interface for creating/updating posts without ID and userId (handled by backend)
export interface NewPost {
  titre: string;
  description: string;
  link?: string;
  image?: File; // File object for image uploads
}

// Interface for creating/updating posts without ID and userId (handled by backend)
export interface AddPost {
  titre: string;
  description: string;
  link?: string;
  image?: File; // File object for image uploads
  state?: string;
}

export interface postLiked {
  postId: number;
}

export interface Comment {
  id: number;
  commentaire: string;
  nom: string;
  prenom: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private apiUrl = 'http://localhost:3000/post'; // Matches your backend route prefix

  constructor(private http: HttpClient, private userService: UserService) {}

  // Helper to create headers with token
  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }


  getActivePosts(state: string): Observable<{ message: string; list: Post[] }> { 
    return this.http.request<{ message: string; list: Post[] }>(
        'GET',
        `${this.apiUrl}/active?state=${state}`,
    );
}

  // Fetch all posts
  getPosts(): Observable<{ message: string; list: Post[] }> {
    return this.http.get<{ message: string; list: Post[] }>(`${this.apiUrl}/getAll`);
  }

  // Fetch a single post by ID
  getPostById(id: number): Observable<Post> {
    const token = this.userService.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    return this.http.get<Post>(`${this.apiUrl}/getpost/${id}`, { headers });
  }

  // Fetch posts by authenticated user
  getPostsByUserId(token: string): Observable<Post[]> {
    const headers = this.getAuthHeaders(token);
    return this.http.get<Post[]>(`${this.apiUrl}/postUser`, { headers });
  }

  // Create a new post (with optional image)
  createPost(post: AddPost, token: string): Observable<{ message: string }> {
    const headers = this.getAuthHeaders(token);

    return this.http.post<{ message: string }>(`${this.apiUrl}/add`, post, { headers });
  }

  // Update an existing post (with optional image)
  updatePost(id: number, post: AddPost, token: string): Observable<{ message: string }> {
    const headers = this.getAuthHeaders(token);

    const updatedPost = {
      'id': id,
      'titre': post.titre,
      'description': post.description,
      'image': post?.image,
      'link': post?.link,
      'state': post?.state
    }

    return this.http.put<{ message: string }>(`${this.apiUrl}/update`, updatedPost, { headers });
  }

  // Delete a post
  deletePost(id: number, token: string): Observable<{ message: string }> {
    const headers = this.getAuthHeaders(token);
    return this.http.get<{ message: string }>(`${this.apiUrl}/delete/${id}`, { headers });
  }

  //get post liked
  postLiked(token: string): Observable<postLiked[] | null> {
    const headers = this.getAuthHeaders(token);
    return this.http.get<postLiked[] | null>(`${this.apiUrl}/getlike`, { headers });
  }

  // Like a post
  likePost(postId: number, token: string): Observable<{ message: string }> {
    const headers = this.getAuthHeaders(token);
    return this.http.post<{ message: string }>(`${this.apiUrl}/like`, { postId }, { headers });
  }

  // Unlike a post
  unlikePost(postId: number, token: string): Observable<{ message: string }> {
    const headers = this.getAuthHeaders(token);
    return this.http.post<{ message: string }>(`${this.apiUrl}/unlike`, { postId }, { headers });
  }

  // Add to favorites
  favouritePost(postId: number, token: string): Observable<{ message: string }> {
    const headers = this.getAuthHeaders(token);
    return this.http.post<{ message: string }>(`${this.apiUrl}/favourite`, { postId }, { headers });
  }

  // Remove from favorites
  unfavouritePost(postId: number, token: string): Observable<{ message: string }> {
    const headers = this.getAuthHeaders(token);
    return this.http.post<{ message: string }>(`${this.apiUrl}/unfavourite`, { postId }, { headers });
  }

  // Add a comment
  addComment(postId: number, commentaire: string, token: string): Observable<{ message: string }> {
    const headers = this.getAuthHeaders(token);
    return this.http.post<{ message: string }>(`${this.apiUrl}/comment`, { postId, commentaire }, { headers });
  }

  // Update a comment
  updateComment(commentId: number, commentaire: string, token: string): Observable<{ message: string; commentaire: Comment }> {
    const headers = this.getAuthHeaders(token);
    return this.http.put<{ message: string; commentaire: Comment }>(`${this.apiUrl}/comment`, { commentId, commentaire }, { headers });
  }

  // Delete a comment
  deleteComment(commentId: number, token: string): Observable<{ message: string }> {
    const headers = this.getAuthHeaders(token);
    return this.http.delete<{ message: string }>(`${this.apiUrl}/comment`, { headers, params: { commentId: commentId.toString() } });
  }

  // Get comments for a post
  getPostComments(postId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/comments/${postId}`);
  }

  changePostStatus(state: string, postId: number):Observable<any> {
    return this.http.put(`${this.apiUrl}/state/${state}/${postId}`, {state: state, postId: postId});
  }
}
