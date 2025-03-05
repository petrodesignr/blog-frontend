import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { UserService } from './services/user.service';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { PostsComponent } from './components/posts/posts.component';
import { HomeComponent } from './components/home/home.component';
import { PostDetailsComponent } from './components/post-details/post-details.component'; // Import PostDetailsComponent

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'posts', component: PostsComponent, canActivate: [() => inject(UserService).isAuthenticated()] },
  { path: 'post/:id', component: PostDetailsComponent } // Add route for PostDetailsComponent
];