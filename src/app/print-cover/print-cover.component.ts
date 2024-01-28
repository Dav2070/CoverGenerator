import { Component, ViewChild, ElementRef } from "@angular/core"
import { ReadFile } from "ngx-file-helpers"
import { decode, encode } from "blurhash"
import { BlobToBase64, PromiseHolder } from "dav-js"
import { DropdownOption, DropdownOptionType } from "dav-ui-components"
import * as StackBlur from "stackblur-canvas"
import {
	CalculateFontSizeRelativeToHeight,
	GetDefaultAuthorNameFontSize,
	GetCoverDimensions
} from "../utils"
import { defaultTitleFontSize } from "../constants"

@Component({
	selector: "app-print-cover",
	templateUrl: "./print-cover.component.html"
})
export class PrintCoverComponent {
	@ViewChild("canvas", { static: true }) canvas: ElementRef<HTMLCanvasElement>
	canvasContext: CanvasRenderingContext2D
	imageName: string = ""
	imageData: string = null
	imageWidth: number = 500
	imageHeight: number = 500
	providerDropdownOptions: DropdownOption[] = [
		{
			key: "lulu",
			value: "Lulu",
			type: DropdownOptionType.option
		},
		{
			key: "bod",
			value: "BoD",
			type: DropdownOptionType.option
		}
	]
	providerDropdownSelectedKey = this.providerDropdownOptions[0].key
	barcodeImageName: string = ""
	barcodeImageData: string = null
	author: string = ""
	title: string = ""
	numberOfPages: number = 0
	overwriteSettings: boolean = false
	titleFontSize: number = null
	titleTextColorBlack: boolean = true
	imageDataBase64: string = ""
	downloadTitle: string = ""

	ngOnInit() {
		this.canvasContext = this.canvas.nativeElement.getContext("2d")
	}

	async Start() {
		if (this.imageData == null) return

		// Clear the canvas
		this.canvasContext.clearRect(0, 0, this.imageWidth, this.imageHeight)

		let image = new Image()
		let imageLoadPromiseHolder = new PromiseHolder()

		image.onload = () => imageLoadPromiseHolder.Resolve()
		image.src = this.imageData
		await imageLoadPromiseHolder.AwaitResult()

		let coverWidth = image.width
		let totalWidthCm = 0
		let totalHeightCm = 0
		let spineWidthCm = 0
		let edgeWidthCm = 0

		if (this.providerDropdownSelectedKey == "bod") {
			let coverDimensions = await GetCoverDimensions(this.numberOfPages)

			totalWidthCm = coverDimensions.gbreite_m
			totalHeightCm = coverDimensions.hoehe_m
			spineWidthCm = coverDimensions.rueckenbreite
			edgeWidthCm = coverDimensions.beschnitt
		} else {
			totalWidthCm = 30.158
			totalHeightCm = 22.225
			spineWidthCm = (this.numberOfPages / 444 + 0.06) * 2.54
			edgeWidthCm = 0.3175
		}

		let coverWidthCm = (totalWidthCm - spineWidthCm) / 2
		let pixelPerCm = coverWidth / coverWidthCm
		let spineWidth = spineWidthCm * pixelPerCm
		let totalWidth = totalWidthCm * pixelPerCm
		let totalHeight = totalHeightCm * pixelPerCm
		let edgeWidth = edgeWidthCm * pixelPerCm

		let clippedCoverWidth = coverWidth - edgeWidth
		let clippedHeight = totalHeight - edgeWidth

		this.imageWidth = totalWidth
		this.imageHeight = totalHeight

		// Set the correct dimensions of the canvas and draw the image
		this.canvas.nativeElement.width = this.imageWidth
		this.canvas.nativeElement.height = this.imageHeight

		// Draw the images
		let blurCanvas = document.createElement("canvas") as HTMLCanvasElement
		let blurCanvasContext = blurCanvas.getContext("2d")
		StackBlur.image(image, blurCanvas, 100, false)

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
			image,
			coverWidth + spineWidth,
			0,
			coverWidth,
			totalHeight
		)

		// Draw the spine
		this.canvasContext.fillStyle = "#394451"
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
		this.canvasContext.font = `${spineAuthorNameFontSize}pt Roboto Light`

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
		this.canvasContext.font = `${spineTitleFontSize}pt Roboto`
		this.canvasContext.translate(totalWidth / 2, spineTitleTextCenter)
		this.canvasContext.rotate((Math.PI / 180) * 270)
		this.canvasContext.fillText(this.title, 0, 0)

		this.canvasContext.restore()
		this.canvasContext.save()

		let bottomPartHeight = Math.ceil(totalHeight * 0.24 + edgeWidth)
		let bottomPartStart = totalHeight - bottomPartHeight

		if (this.barcodeImageData != null) {
			// Draw the barcode image on the back
			let barcodeImage = new Image()
			let barcodeImageLoadPromiseHolder = new PromiseHolder()

			barcodeImage.onload = () => barcodeImageLoadPromiseHolder.Resolve()
			barcodeImage.src = this.barcodeImageData
			await barcodeImageLoadPromiseHolder.AwaitResult()

			let barcodeImageRatio = barcodeImage.height / barcodeImage.width
			let barcodeImageWidth = 2.6 * pixelPerCm
			let barcodeImageHeight = barcodeImageRatio * barcodeImageWidth

			// Place the barcode image on the center of the bottom part
			this.canvasContext.drawImage(
				barcodeImage,
				edgeWidth + clippedCoverWidth / 2 - barcodeImageWidth / 2,
				bottomPartStart + bottomPartHeight / 2 - barcodeImageHeight / 2,
				barcodeImageWidth,
				barcodeImageHeight
			)
		}

		// Generate the blurhash for the bottom part
		let imageData = this.canvasContext.getImageData(
			coverWidth + spineWidth,
			bottomPartStart,
			coverWidth,
			bottomPartHeight
		)

		let blurhash = encode(
			imageData.data,
			imageData.width,
			imageData.height,
			2,
			2
		)

		let blurhashPixels = decode(blurhash, coverWidth, bottomPartHeight)
		let blurhashImageData = this.canvasContext.createImageData(
			coverWidth,
			bottomPartHeight
		)
		blurhashImageData.data.set(blurhashPixels)

		// Add the blurhashed bottom part to the canvas
		this.canvasContext.putImageData(
			blurhashImageData,
			coverWidth + spineWidth,
			bottomPartStart
		)

		let firstBlurhashPixelColor =
			blurhashImageData.data[0] +
			blurhashImageData.data[1] +
			blurhashImageData.data[2]
		let textColor = firstBlurhashPixelColor > 382 ? "black" : "white"

		if (this.overwriteSettings) {
			textColor = this.titleTextColorBlack ? "black" : "white"
		}

		// Get the title
		let titleParts = this.title.split("\n")
		let titleFirstLine = titleParts[0]
		let titleSecondLine = ""

		if (titleParts.length > 1) {
			titleSecondLine = titleParts[1]
		}

		// Write the author name to the canvas
		let authorNameFontSize = GetDefaultAuthorNameFontSize(clippedHeight)
		this.canvasContext.fillStyle = textColor
		this.canvasContext.textAlign = "center"
		this.canvasContext.font = `${authorNameFontSize}pt Roboto Light`

		let authorNameYPosition =
			bottomPartStart +
			authorNameFontSize / 2 +
			(bottomPartHeight - edgeWidth) / 4
		if (titleSecondLine.length > 0)
			authorNameYPosition =
				bottomPartStart +
				authorNameFontSize / 2 +
				(bottomPartHeight - edgeWidth) / 6

		this.canvasContext.fillText(
			this.author,
			coverWidth + spineWidth + clippedCoverWidth / 2,
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
				titleFontSize = titleFontSize - (titleFirstLine.length - 15) * 4
			}

			if (titleSecondLine.length > 0)
				titleFontSize = Math.ceil(titleFontSize * 0.8)
			this.titleFontSize = titleFontSize
		}
		titleFontSize = CalculateFontSizeRelativeToHeight(
			titleFontSize,
			clippedHeight
		)

		this.canvasContext.font = `${titleFontSize}pt Roboto`

		if (titleSecondLine.length == 0) {
			// One line of text
			this.canvasContext.fillText(
				titleFirstLine,
				coverWidth + spineWidth + clippedCoverWidth / 2,
				bottomPartStart +
					titleFontSize / 2 +
					(bottomPartHeight - edgeWidth) / 2 +
					(bottomPartHeight - edgeWidth) / 7
			)
		} else {
			// Two lines of text
			let bottomTitlePartHeight = clippedHeight - authorNameYPosition

			this.canvasContext.fillText(
				titleFirstLine,
				coverWidth + spineWidth + clippedCoverWidth / 2,
				authorNameYPosition +
					titleFontSize / 2 +
					bottomTitlePartHeight / 3.3
			)

			this.canvasContext.fillText(
				titleSecondLine,
				coverWidth + spineWidth + clippedCoverWidth / 2,
				authorNameYPosition +
					titleFontSize / 2 +
					bottomTitlePartHeight / 2 +
					bottomTitlePartHeight / 5
			)
		}

		this.imageDataBase64 = this.canvas.nativeElement.toDataURL("image/jpeg")
		this.downloadTitle = "printCover.jpg"
	}

	ProviderDropdownSelectionChange(event: CustomEvent) {
		this.providerDropdownSelectedKey = event.detail.key
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
		let barcodeImageBlob = new Blob([file.underlyingFile], {
			type: file.type
		})
		this.barcodeImageData = await BlobToBase64(barcodeImageBlob)
	}
}
