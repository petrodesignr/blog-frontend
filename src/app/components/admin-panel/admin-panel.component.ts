import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
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


interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

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
  isLikedByUser?: number;
  likeCount?: number;
  state?: string
  nom?: string;
  prenom?: string;
}

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    
    FormsModule,
    MatCardModule,
    MatButtonModule,
    TimeAgoPipe],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {
  users: any[] = []; // Assuming user list is fetched
  selectedUserId: number | null = null;
  newRole: string = 'user'; // Default role
  token: string | null = '';
  isAuth: boolean = false;
  posts: Post[] = [];
  awaitingPosts: Post[] = [];

  constructor(private http: HttpClient, public userService: UserService, public postService: PostService, private sanitizer: DomSanitizer, private router: Router) {
    this.fetchAwaitingPosts();
    this.isAuth = this.userService.isAuthorised()
  }

  newStatusMap: { [key: number]: string } = {}; // Object to track status per post

  ngOnInit() {
    this.token = this.userService.getToken();
    this.fetchUsers();
  }

  fetchUsers() {
    this.userService.getAllUsers().subscribe((response: User[]) => this.users = response);
  }

  changeUserRole() {
    if (!this.token) {
      alert('Please log in to unlike a post');
      return;
    }
    if (this.selectedUserId) {
      this.userService.updateUserRole(this.selectedUserId, this.newRole).subscribe({
        next: (res) => alert('User role updated successfully'),
        error: (err) => console.error('Error updating role:', err),
      });
    }
  }

  changeStatus(postId: number) {
    const newStatus = this.newStatusMap[postId]; // Get the selected status for this post
  
    if (this.isAuth && newStatus && newStatus !== 'awaiting') {
      this.postService.changePostStatus(newStatus, postId).subscribe({
        next: () => {
          this.fetchAwaitingPosts();
        }
      });
    }
  }

  navigateToPost(postId: number) {
    console.log('Navigating to post:', postId); // Debug log
    this.router.navigate(['/post', postId]);
  }

  fetchAwaitingPosts() {
    this.token = this.userService.getToken();
  
    this.postService.getActivePosts("awaiting").subscribe({
      next: (response) => {
  
        this.awaitingPosts = response.list.map((post: Post) => {
          if (post.image) {
            post.imageUrl = `http://localhost:3000/${post.image}`;
          }
          post.formattedDate = this.formatDate(post.createdAt);
  
          return post;
        });
  
        this.awaitingPosts.forEach((post) => {
          this.newStatusMap[post.id] = post.state || 'awaiting'; // Ensure a default value
        });
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

}

