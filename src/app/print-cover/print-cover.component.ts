import { Component, ViewChild, ElementRef } from "@angular/core"
import { ReadFile } from "ngx-file-helpers"
import { BlobToBase64, PromiseHolder } from "dav-js"
import * as StackBlur from "stackblur-canvas"

@Component({
	selector: "app-print-cover",
	templateUrl: "./print-cover.component.html"
})
export class PrintCoverComponent {
	@ViewChild("canvas", { static: true }) canvas: ElementRef<HTMLCanvasElement>
	canvasContext: CanvasRenderingContext2D
	backgroundImageName: string = ""
	backgroundImageData: string = null
	coverImageName: string = ""
	coverImageData: string = null
	imageWidth: number = 500
	imageHeight: number = 500
	author: string = ""
	title: string = ""
	numberOfPages: number = 0
	imageDataBase64: string = ""
	downloadTitle: string = ""

	ngOnInit() {
		this.canvasContext = this.canvas.nativeElement.getContext("2d")
	}

	async Start() {
		if (this.backgroundImageData == null || this.coverImageData == null) {
			return
		}

		// Clear the canvas
		this.canvasContext.clearRect(0, 0, this.imageWidth, this.imageHeight)

		// Load the background image
		let backgroundImage = new Image()
		let backgroundImageLoadPromiseHolder = new PromiseHolder()

		backgroundImage.onload = () => backgroundImageLoadPromiseHolder.Resolve()
		backgroundImage.src = this.backgroundImageData
		await backgroundImageLoadPromiseHolder.AwaitResult()

		// Load the cover image
		let coverImage = new Image()
		let coverImageLoadPromiseHolder = new PromiseHolder()

		coverImage.onload = () => coverImageLoadPromiseHolder.Resolve()
		coverImage.src = this.coverImageData
		await coverImageLoadPromiseHolder.AwaitResult()

		let coverWidth = backgroundImage.width
		let totalWidthCm = 30.158
		let totalHeightCm = 22.225
		let spineWidthCm = (this.numberOfPages / 444 + 0.06) * 2.54

		let coverWidthCm = (totalWidthCm - spineWidthCm) / 2
		let pixelPerCm = coverWidth / coverWidthCm
		let spineWidth = spineWidthCm * pixelPerCm
		let totalWidth = totalWidthCm * pixelPerCm
		let totalHeight = totalHeightCm * pixelPerCm

		this.imageWidth = totalWidth
		this.imageHeight = totalHeight

		// Set the correct dimensions of the canvas and draw the image
		this.canvas.nativeElement.width = this.imageWidth
		this.canvas.nativeElement.height = this.imageHeight

		// Draw the images
		let blurCanvas = document.createElement("canvas") as HTMLCanvasElement
		let blurCanvasContext = blurCanvas.getContext("2d")
		StackBlur.image(backgroundImage, blurCanvas, 100, false)

		blurCanvasContext.fillStyle = "#00000088"
		blurCanvasContext.fillRect(0, 0, coverWidth, totalHeight)

		let blurCanvasImage = new Image()
		let blurCanvasImageLoadPromiseHolder = new PromiseHolder()

		blurCanvasImage.onload = () => blurCanvasImageLoadPromiseHolder.Resolve()
		blurCanvasImage.src = blurCanvas.toDataURL()
		await blurCanvasImageLoadPromiseHolder.AwaitResult()

		this.canvasContext.drawImage(
			blurCanvasImage,
			0,
			0,
			coverWidth,
			totalHeight
		)
		this.canvasContext.drawImage(
			coverImage,
			coverWidth + spineWidth,
			0,
			coverWidth,
			totalHeight
		)

		// Draw the spine
		this.canvasContext.fillStyle = "#222"
		this.canvasContext.fillRect(coverWidth, 0, spineWidth, totalHeight)

		// Load the Standard Ebooks logo
		let logoImage = new Image()
		let logoImageLoadPromiseHolder = new PromiseHolder()

		logoImage.onload = () => logoImageLoadPromiseHolder.Resolve()
		logoImage.src = "/assets/standardebooks.png"
		await logoImageLoadPromiseHolder.AwaitResult()

		// Draw the Standard Ebooks logo on the spine
		const spineOuterDistance = 64 + 0.5 * pixelPerCm
		let logoImageRatio = logoImage.height / logoImage.width
		let adaptedLogoImageWidth = spineWidth * 0.88
		if (adaptedLogoImageWidth > 210) adaptedLogoImageWidth = 210
		let adaptedLogoImageHeight = logoImageRatio * adaptedLogoImageWidth

		this.canvasContext.drawImage(
			logoImage,
			coverWidth + (spineWidth - adaptedLogoImageWidth) / 2,
			spineOuterDistance,
			adaptedLogoImageWidth,
			adaptedLogoImageHeight
		)
		this.canvasContext.save()

		// Draw the author name on the spine
		let spineAuthorNameFontSize = spineWidth * 0.29
		if (spineAuthorNameFontSize > 58) spineAuthorNameFontSize = 58

		this.canvasContext.fillStyle = "white"
		this.canvasContext.textAlign = "left"
		this.canvasContext.textBaseline = "middle"
		this.canvasContext.font = `${spineAuthorNameFontSize}pt League Spartan`

		// Position the context on the edge of the spine
		this.canvasContext.translate(
			totalWidth / 2,
			totalHeight - spineOuterDistance
		)

		this.canvasContext.rotate((Math.PI / 180) * 270)
		this.canvasContext.fillText(this.author, 0, 0)

		// Calculate the available space between the author name and the logo
		let outerDistanceTop = adaptedLogoImageHeight + spineOuterDistance
		let outerDistanceBottom =
			this.canvasContext.measureText(this.author).width + spineOuterDistance

		// Calculate the center between the author name and logo
		let spineTitleTextCenter =
			(totalHeight - outerDistanceTop - outerDistanceBottom) / 2 +
			outerDistanceTop

		this.canvasContext.restore()
		this.canvasContext.save()

		// Draw the title on the spine
		let spineTitleFontSize = spineWidth * 0.32
		if (spineTitleFontSize > 64) spineTitleFontSize = 64

		this.canvasContext.fillStyle = "white"
		this.canvasContext.textAlign = "center"
		this.canvasContext.textBaseline = "middle"
		this.canvasContext.font = `${spineTitleFontSize}pt League Spartan`
		this.canvasContext.translate(totalWidth / 2, spineTitleTextCenter)
		this.canvasContext.rotate((Math.PI / 180) * 270)
		this.canvasContext.fillText(this.title, 0, 0)

		this.canvasContext.restore()
		this.canvasContext.save()

		this.imageDataBase64 = this.canvas.nativeElement.toDataURL("image/jpeg")
		this.downloadTitle = "printCover.jpg"
	}

	async backgroundImageFilePicked(file: ReadFile) {
		// Read the selected image file
		this.backgroundImageName = file.name
		let imageBlob = new Blob([file.underlyingFile], { type: file.type })
		this.backgroundImageData = await BlobToBase64(imageBlob)
	}

	async coverImageFilePicked(file: ReadFile) {
		// Read the selected image file
		this.coverImageName = file.name
		let imageBlob = new Blob([file.underlyingFile], { type: file.type })
		this.coverImageData = await BlobToBase64(imageBlob)
	}
}
