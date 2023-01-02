import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { FormsModule } from '@angular/forms'
import { RouterModule, Routes } from '@angular/router'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { NgxFileHelpersModule } from 'ngx-file-helpers'

import { AppComponent } from './app.component'
import { CoverComponent } from './cover/cover.component';
import { PrintCoverComponent } from './print-cover/print-cover.component'
import { EpubToDocxComponent } from './epub-to-docx/epub-to-docx.component'

const routes: Routes = [
	{ path: "", component: CoverComponent },
	{ path: "print", component: PrintCoverComponent },
	{ path: "epub-to-docx", component: EpubToDocxComponent }
]

@NgModule({
	declarations: [
		AppComponent,
		CoverComponent,
		PrintCoverComponent,
		EpubToDocxComponent
	],
	imports: [
		BrowserModule,
		FormsModule,
		RouterModule.forRoot(routes),
		NgbModule,
		NgxFileHelpersModule
	],
	providers: [],
   bootstrap: [AppComponent],
   schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
