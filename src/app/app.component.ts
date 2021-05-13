import { Component, ElementRef, ViewChild } from '@angular/core'
import { ReadFile } from 'ngx-file-helpers'
import { decode, encode } from 'blurhash'
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

		// Read the selected imgae file
		let imageBlob = new Blob([file.underlyingFile], { type: file.type })
		let imageBase64 = await BlobToBase64(imageBlob)

		let image = new Image()
		let imageLoadPromiseHolder = new PromiseHolder()

		image.onload = () => imageLoadPromiseHolder.resolve()
		image.src = imageBase64
		await imageLoadPromiseHolder.AwaitResult()

		this.imageWidth = image.width
		this.imageHeight = image.height

		// Set the correct dimensions of the canvas and draw the image
		this.canvas.nativeElement.setAttribute("width", this.imageWidth.toString())
		this.canvas.nativeElement.setAttribute("height", this.imageHeight.toString())

		this.canvasContext.drawImage(image,
			0, 0, this.imageWidth - 1, this.imageHeight - 1,
			0, 0, this.imageWidth, this.imageHeight
		)

		// Generate the blurhash for the bottom part
		let bottomPartHeight = this.imageHeight * 0.24
		let bottomPartStart = this.imageHeight - bottomPartHeight
		let imageData = this.canvasContext.getImageData(0, bottomPartStart, this.imageWidth, bottomPartHeight)

		let blurhash = encode(imageData.data, imageData.width, imageData.height, 4, 3)

		let blurhashPixels = decode(blurhash, this.imageWidth, bottomPartHeight)
		let blurhashImageData = this.canvasContext.createImageData(this.imageWidth, bottomPartHeight)
		blurhashImageData.data.set(blurhashPixels)

		// Add the blurhashed bottom part to the canvas
		this.canvasContext.putImageData(blurhashImageData, 0, bottomPartStart)
	}
}