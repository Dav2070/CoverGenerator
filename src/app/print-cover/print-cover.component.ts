import { Component, ViewChild, ElementRef } from '@angular/core'
import { ReadFile } from 'ngx-file-helpers'
import { BlobToBase64, PromiseHolder } from 'dav-js'
import * as StackBlur from 'stackblur-canvas'

@Component({
	selector: 'app-print-cover',
	templateUrl: './print-cover.component.html'
})
export class PrintCoverComponent {
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
	overwriteSettings: boolean = false
	titleFontSize: number = null
	titleTextColorBlack: boolean = true
	imageDataBase64: string = ""
	downloadTitle: string = ""

	ngOnInit() {
		this.canvasContext = this.canvas.nativeElement.getContext('2d')
	}

	async Start() {
		if (this.imageData == null || this.barcodeImageData == null) return

		// Clear the canvas
		this.canvasContext.clearRect(0, 0, this.imageWidth, this.imageHeight)

		let image = new Image()
		let imageLoadPromiseHolder = new PromiseHolder()

		image.onload = () => imageLoadPromiseHolder.Resolve()
		image.src = this.imageData
		await imageLoadPromiseHolder.AwaitResult()

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
}