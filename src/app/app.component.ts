import { Component, ElementRef, ViewChild } from '@angular/core'
import { ReadFile } from 'ngx-file-helpers'
import { decode, encode } from 'blurhash'
import { BlobToBase64, PromiseHolder } from 'dav-js'
import * as StackBlur from 'stackblur-canvas'

const defaultAuthorNameFontSize = 84
const defaultTitleFontSize = 118

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
	barcodeImageName: string = ""
	barcodeImageData: string = null
	author: string = ""
	title: string = ""
	printCover: boolean = false
	overwriteSettings: boolean = false
	titleFontSize: number = null
	titleTextColorBlack: boolean = true
	imageDataBase64: string = ""
	downloadTitle: string = ""

	ngOnInit() {
		this.canvasContext = this.canvas.nativeElement.getContext('2d')
	}

	async Start() {
		if (this.imageData == null) return
		if (this.printCover && this.barcodeImageData == null) return
		if (
			this.overwriteSettings
			&& this.titleFontSize == null
		) return

		// Clear the canvas
		this.canvasContext.clearRect(0, 0, this.imageWidth, this.imageHeight)

		let image = new Image()
		let imageLoadPromiseHolder = new PromiseHolder()

		image.onload = () => imageLoadPromiseHolder.Resolve()
		image.src = this.imageData
		await imageLoadPromiseHolder.AwaitResult()

		if (this.printCover) {
			let coverWidth = image.width
			let coverHeight = image.height

			let totalWidthCm = 25.82
			let spineWidthCm = 0.82
			let edgeWidthCm = 0.5
			let coverWidthCm = (totalWidthCm - spineWidthCm) / 2

			let pixelPerCm = coverWidth / coverWidthCm
			let spineWidth = spineWidthCm * pixelPerCm
			let totalWidth = totalWidthCm * pixelPerCm
			let edgeWidth = edgeWidthCm * pixelPerCm

			let clippedCoverWidth = coverWidth - edgeWidth
			let clippedCoverHeight = coverHeight - edgeWidth

			this.imageWidth = totalWidth
			this.imageHeight = coverHeight

			// Set the correct dimensions of the canvas and draw the image
			this.canvas.nativeElement.width = this.imageWidth
			this.canvas.nativeElement.height = this.imageHeight

			// Draw the images
			let blurCanvas = document.createElement("canvas") as HTMLCanvasElement
			let blurCanvasContext = blurCanvas.getContext('2d')
			StackBlur.image(image, blurCanvas, 100, false)

			blurCanvasContext.fillStyle = "#00000088"
			blurCanvasContext.fillRect(0, 0, coverWidth, coverHeight)

			let blurCanvasImage = new Image()
			let blurCanvasImageLoadPromiseHolder = new PromiseHolder()

			blurCanvasImage.onload = () => blurCanvasImageLoadPromiseHolder.Resolve()
			blurCanvasImage.src = blurCanvas.toDataURL()
			await blurCanvasImageLoadPromiseHolder.AwaitResult()

			this.canvasContext.drawImage(blurCanvasImage, 0, 0, coverWidth, coverHeight)
			this.canvasContext.drawImage(image, coverWidth + spineWidth, 0, coverWidth, coverHeight)

			// Draw the spine
			this.canvasContext.fillStyle = "#394451"
			this.canvasContext.fillRect(coverWidth, 0, spineWidth, coverHeight)

			// Load the Standard Ebooks logo
			let logoImage = new Image()
			let logoImageLoadPromiseHolder = new PromiseHolder()

			logoImage.onload = () => logoImageLoadPromiseHolder.Resolve()
			logoImage.src = "/assets/standardebooks.png"
			await logoImageLoadPromiseHolder.AwaitResult()

			// Draw the Standard Ebooks logo on the spine
			let logoImageRatio = logoImage.height / logoImage.width
			let adaptedLogoImageWidth = spineWidth
			let adaptedLogoImageHeight = logoImageRatio * adaptedLogoImageWidth

			this.canvasContext.drawImage(logoImage, coverWidth, (coverHeight / 2) - (adaptedLogoImageHeight / 2), spineWidth, adaptedLogoImageHeight)

			// Draw the barcode image on the back
			let barcodeImage = new Image()
			let barcodeImageLoadPromiseHolder = new PromiseHolder()

			barcodeImage.onload = () => barcodeImageLoadPromiseHolder.Resolve()
			barcodeImage.src = this.barcodeImageData
			await barcodeImageLoadPromiseHolder.AwaitResult()

			let barcodeImageRatio = barcodeImage.height / barcodeImage.width
			let barcodeImageWidth = 3 * pixelPerCm		// 4 cm
			let barcodeImageHeight = barcodeImageRatio * barcodeImageWidth

			this.canvasContext.drawImage(barcodeImage, edgeWidth + (clippedCoverWidth / 2) - (barcodeImageWidth / 2), coverHeight * 0.8, barcodeImageWidth, barcodeImageHeight)

			this.imageDataBase64 = this.canvas.nativeElement.toDataURL("image/jpeg")
			this.downloadTitle = "printCover.jpg"
		} else {
			this.imageWidth = image.width
			this.imageHeight = image.height

			// Set the correct dimensions of the canvas and draw the image
			this.canvas.nativeElement.width = this.imageWidth
			this.canvas.nativeElement.height = this.imageHeight

			this.canvasContext.drawImage(image,
				0, 0, this.imageWidth, this.imageHeight,
				0, 0, this.imageWidth, this.imageHeight
			)

			// Generate the blurhash for the bottom part
			let bottomPartHeight = Math.ceil(this.imageHeight * 0.24)
			let bottomPartStart = this.imageHeight - bottomPartHeight
			let imageData = this.canvasContext.getImageData(0, bottomPartStart, this.imageWidth, bottomPartHeight)

			let blurhash = encode(imageData.data, imageData.width, imageData.height, 2, 2)

			let blurhashPixels = decode(blurhash, this.imageWidth, bottomPartHeight)
			let blurhashImageData = this.canvasContext.createImageData(this.imageWidth, bottomPartHeight)
			blurhashImageData.data.set(blurhashPixels)

			// Add the blurhashed bottom part to the canvas
			this.canvasContext.putImageData(blurhashImageData, 0, bottomPartStart)

			let firstBlurhashPixelColor = blurhashImageData.data[0] + blurhashImageData.data[1] + blurhashImageData.data[2]
			let textColor = firstBlurhashPixelColor > 382 ? "black" : "white"

			if (this.overwriteSettings) {
				textColor = this.titleTextColorBlack ? "black" : "white"
			}

			// Get the title
			let titleParts = this.title.split('\n')
			let titleFirstLine = titleParts[0]
			let titleSecondLine = ""

			if (titleParts.length > 1) {
				titleSecondLine = titleParts[1]
			}

			// Write the author name to the canvas
			let authorNameFontSize = this.GetDefaultAuthorNameFontSize(this.imageHeight)
			this.canvasContext.fillStyle = textColor
			this.canvasContext.textAlign = "center"
			this.canvasContext.font = `${authorNameFontSize}pt Roboto Light`

			let authorNameYPosition = (bottomPartStart + authorNameFontSize / 2) + (bottomPartHeight / 4)
			if (titleSecondLine.length > 0) authorNameYPosition = (bottomPartStart + authorNameFontSize / 2) + (bottomPartHeight / 6)

			this.canvasContext.fillText(
				this.author,
				this.imageWidth / 2,
				authorNameYPosition
			)

			// Write the title to the canvas
			let titleFontSize = defaultTitleFontSize

			if (this.overwriteSettings) {
				titleFontSize = this.titleFontSize
			} else {
				// Font sizes: 0-15 length -> 118
				// + 1 length -> -5 pt
				if (titleFirstLine.length > 15) {
					titleFontSize = titleFontSize - ((titleFirstLine.length - 15) * 4)
				}

				if (titleSecondLine.length > 0) titleFontSize = Math.ceil(titleFontSize * 0.8)
				this.titleFontSize = titleFontSize
			}
			titleFontSize = this.CalculateFontSizeRelativeToHeight(titleFontSize, this.imageHeight)

			this.canvasContext.font = `${titleFontSize}pt Roboto`

			if (titleSecondLine.length == 0) {
				// One line of text
				this.canvasContext.fillText(
					titleFirstLine,
					this.imageWidth / 2,
					(bottomPartStart + titleFontSize / 2) + (bottomPartHeight / 2) + (bottomPartHeight / 7)
				)
			} else {
				// Two lines of text
				let bottomTitlePartHeight = this.imageHeight - authorNameYPosition

				this.canvasContext.fillText(
					titleFirstLine,
					this.imageWidth / 2,
					(authorNameYPosition + titleFontSize / 2) + (bottomTitlePartHeight / 3.3)
				)

				this.canvasContext.fillText(
					titleSecondLine,
					this.imageWidth / 2,
					(authorNameYPosition + titleFontSize / 2) + (bottomTitlePartHeight / 2) + (bottomTitlePartHeight / 5)
				)
			}

			this.imageDataBase64 = this.canvas.nativeElement.toDataURL("image/jpeg")
			this.downloadTitle = this.title.replace('\n', ' ') + ".jpg"
		}
	}

	async ImageFilePicked(file: ReadFile) {
		// Read the selected image file
		this.imageName = file.name
		let imageBlob = new Blob([file.underlyingFile], { type: file.type })
		this.imageData = await BlobToBase64(imageBlob)
	}

	async BarcodeFilePicked(file: ReadFile) {
		// Read the selected image file
		this.barcodeImageName = file.name
		let barcodeImageBlob = new Blob([file.underlyingFile], { type: file.type })
		this.barcodeImageData = await BlobToBase64(barcodeImageBlob)
	}

	CalculateFontSizeRelativeToHeight(originalFontSize: number, resultHeight: number): number {
		return Math.ceil((originalFontSize / 2100) * resultHeight)
	}

	GetDefaultAuthorNameFontSize(height: number): number {
		return this.CalculateFontSizeRelativeToHeight(defaultAuthorNameFontSize, height)
	}
}