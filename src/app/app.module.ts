import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { FormsModule } from '@angular/forms'
import { RouterModule, Routes } from '@angular/router'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { NgxFileHelpersModule } from 'ngx-file-helpers'

import { AppComponent } from './app.component'
import { CoverComponent } from './cover/cover.component'

const routes: Routes = [
	{ path: "", component: CoverComponent }
]

@NgModule({
	declarations: [
		AppComponent,
		CoverComponent
	],
	imports: [
		BrowserModule,
		FormsModule,
		RouterModule.forRoot(routes),
		NgbModule,
		NgxFileHelpersModule
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule { }
