import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router'; // Import Router
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  user = { email: '', password: '' };

  constructor(private userService: UserService, private router: Router) {} // Inject Router

  login() {
    this.userService.login(this.user).subscribe({
      next: (response) => {
        this.userService.saveToken(response.data);
        this.router.navigate(['/']);
      },
      error: () => {
        alert('Login failed');
      }
    });
  }
}
