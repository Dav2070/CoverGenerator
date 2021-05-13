import { Component, ElementRef, ViewChild } from '@angular/core'
import { ReadFile } from 'ngx-file-helpers'
import { BlobToBase64, PromiseHolder } from 'dav-js'

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	@ViewChild('canvas', { static: true }) canvas: ElementRef<HTMLCanvasElement>
	canvasContext: CanvasRenderingContext2D
	imageWidth: number = 500
	imageHeight: number = 500

	ngOnInit() {
		this.canvasContext = this.canvas.nativeElement.getContext('2d')
	}

	async ImageFilePicked(file: ReadFile) {
		this.canvasContext.clearRect(0, 0, this.imageWidth, this.imageHeight)

		let imageBlob = new Blob([file.underlyingFile], { type: file.type })
		let imageBase64 = await BlobToBase64(imageBlob)

		let image = new Image()
		let imageLoadPromiseHolder = new PromiseHolder()

		image.onload = () => imageLoadPromiseHolder.resolve()
		image.src = imageBase64
		await imageLoadPromiseHolder.AwaitResult()

		this.imageWidth = image.width
		this.imageHeight = image.height

		this.canvas.nativeElement.setAttribute("width", this.imageWidth.toString())
		this.canvas.nativeElement.setAttribute("height", this.imageHeight.toString())

		this.canvasContext.drawImage(image,
			0, 0, this.imageWidth - 1, this.imageHeight - 1,
			0, 0, this.imageWidth, this.imageHeight
		)
	}
}