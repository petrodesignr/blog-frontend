import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  user = { nom: '', prenom: '', email: '', password: '' };

  constructor(private userService: UserService) {}

  // register() {
  //   this.userService.register(this.user).subscribe(response => {
  //     alert('User registered successfully');
  //   }, error => {
  //     alert('Registration failed');
  //   });
  // }
  register() {
    console.log(this.user);
    this.userService.register(this.user).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        alert('User registered successfully');
      },
      error: (error) => {
        console.error('Registration failed:', error);
        alert(error.error?.message || 'Registration failed');
      }
    });
  }

}
