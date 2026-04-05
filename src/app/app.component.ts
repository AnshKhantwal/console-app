import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import 'zone.js';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  title = 'patient-management';
}