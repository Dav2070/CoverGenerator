import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core"
import { BrowserModule } from "@angular/platform-browser"
import { FormsModule } from "@angular/forms"
import { RouterModule, Routes } from "@angular/router"
import { NgbModule } from "@ng-bootstrap/ng-bootstrap"
import { NgxFileHelpersModule } from "ngx-file-helpers"

import { AppComponent } from "./app.component"
import { CoverComponent } from "./cover/cover.component"
import { PrintCoverLegacyComponent } from "./print-cover-legacy/print-cover-legacy.component"

const routes: Routes = [
	{ path: "", component: CoverComponent },
	{ path: "print-cover-legacy", component: PrintCoverLegacyComponent }
]

@NgModule({
	declarations: [AppComponent, CoverComponent, PrintCoverLegacyComponent],
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
export class AppModule {}
