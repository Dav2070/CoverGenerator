import { Component, ElementRef, ViewChild } from '@angular/core'
import { ReadFile } from 'ngx-file-helpers'
import { decode, encode } from 'blurhash'
import { BlobToBase64, PromiseHolder } from 'dav-js'

const authorNameFontSize = 84
const titleFontSize = 118

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	@ViewChild('canvas', { static: true }) canvas: ElementRef<HTMLCanvasElement>
	canvasContext: CanvasRenderingContext2D
	imageName: string = ""
	imageData: string = null
	imageWidth: number = 500
	imageHeight: number = 500
	author: string = ""
	title: string = ""

	ngOnInit() {
		this.canvasContext = this.canvas.nativeElement.getContext('2d')
	}

	async Start() {
		if (this.imageData == null) return
		
		// Clear the canvas
		this.canvasContext.clearRect(0, 0, this.imageWidth, this.imageHeight)

		let image = new Image()
		let imageLoadPromiseHolder = new PromiseHolder()

		image.onload = () => imageLoadPromiseHolder.resolve()
		image.src = this.imageData
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

		let firstBlurhashPixelColor = blurhashImageData.data[0] + blurhashImageData.data[1] + blurhashImageData.data[2]
		let textColor = firstBlurhashPixelColor > 382 ? "black" : "white"

		// Write the author name to the canvas
		this.canvasContext.fillStyle = textColor
		this.canvasContext.textAlign = "center"
		this.canvasContext.font = `${authorNameFontSize}pt Roboto Light`
		this.canvasContext.fillText(
			this.author,
			this.imageWidth / 2,
			(bottomPartStart + authorNameFontSize / 2) + (bottomPartHeight / 4)
		)

		// Write the title to the canvas
		this.canvasContext.font = `${titleFontSize}pt Roboto`
		this.canvasContext.fillText(
			this.title,
			this.imageWidth / 2,
			(bottomPartStart + titleFontSize / 2) + (bottomPartHeight / 2) + (bottomPartHeight / 7)
		)
	}

	async ImageFilePicked(file: ReadFile) {
		// Read the selected imgae file
		this.imageName = file.name
		let imageBlob = new Blob([file.underlyingFile], { type: file.type })
		this.imageData = await BlobToBase64(imageBlob)
	}
}