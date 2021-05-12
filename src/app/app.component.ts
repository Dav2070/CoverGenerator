import { Component } from '@angular/core'
import { ReadFile } from 'ngx-file-helpers'

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {

	ImageFilePicked(file: ReadFile) {
		
	}
}