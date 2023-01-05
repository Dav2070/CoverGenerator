import { Component } from '@angular/core'
import axios from 'axios'
import * as JSZip from 'jszip'
import { PromiseHolder } from 'dav-js'
import { convertioApiKey } from '../../environments/secrets'

const documentFileName = "word/document.xml"

@Component({
	selector: 'app-epub-to-docx',
	templateUrl: './epub-to-docx.component.html'
})
export class EpubToDocxComponent {
	isLoading: boolean = false
	url: string = ""

	async Start() {
		this.isLoading = true

		let conversionId = await this.CreateConversion(this.url)
		if (conversionId == null) {
			this.isLoading = false
			return
		}

		// Wait for the conversion to complete
		let status = "convert"
		let outputFileUrl = null

		while (status == "convert") {
			let waitPromiseHolder = new PromiseHolder()
			setTimeout(() => waitPromiseHolder.Resolve(), 5000)
			await waitPromiseHolder.AwaitResult()

			let statusResponse = await this.GetConversionStatus(conversionId)
			status = statusResponse["data"]["step"]

			if (statusResponse["data"]["output"]) {
				outputFileUrl = statusResponse["data"]["output"]["url"]
			}
		}

		if (status == "failed" || outputFileUrl == null) {
			this.isLoading = false
			return
		}

		// Download the converted file
		let outputFileBlob = await this.DownloadFile(outputFileUrl)
		let zip = await JSZip.loadAsync(outputFileBlob)
		let parser = new DOMParser()
		let serializer = new XMLSerializer()

		await this.AdaptDocument(zip, parser, serializer)

		await this.SendDocxFile(zip)
		this.isLoading = false
	}

	async CreateConversion(url: string): Promise<string> {
		try {
			let response = await axios({
				method: 'post',
				url: 'https://api.convertio.co/convert',
				headers: {
					'Content-Type': 'application/json'
				},
				data: {
					apikey: convertioApiKey,
					input: 'url',
					file: url,
					outputformat: 'docx'
				}
			})

			return response.data.data.id
		} catch (error) {
			console.log("Error in creating conversion")
			console.error(error)
		}

		return null
	}

	async GetConversionStatus(conversionId: string): Promise<string> {
		try {
			let response = await axios({
				method: 'get',
				url: `https://api.convertio.co/convert/${conversionId}/status`
			})

			return response.data
		} catch (error) {
			console.log("Error in getting conversion status")
			console.error(error)
		}

		return null
	}

	async DownloadFile(url: string): Promise<Blob> {
		try {
			let response = await axios({
				method: 'get',
				url,
				responseType: 'blob'
			})

			return new Blob([response.data], { type: 'application/zip' })
		} catch (error) {
			console.log("Error in downloading the converted file")
			console.error(error)
		}

		return null
	}

	async AdaptDocument(zip: JSZip, parser: DOMParser, serializer: XMLSerializer) {
		let content = await zip.file(documentFileName).async("string")
		let doc = parser.parseFromString(content, "text/xml")

		let documentTag = doc.getElementsByTagName("w:document")[0]
		let bodyTag = documentTag.getElementsByTagName("w:body")[0]
		let sectionTag = bodyTag.getElementsByTagName("w:sectPr")[0]
		let pageSizeTag = sectionTag.getElementsByTagName("w:pgSz")[0]
		let pageMarginTag = sectionTag.getElementsByTagName("w:pgMar")[0]

		// Set the page size
		pageSizeTag.setAttribute("w:w", "7938")
		pageSizeTag.setAttribute("w:h", "12247")
		pageSizeTag.setAttribute("w:code", "6")

		// Set the page margins
		pageMarginTag.setAttribute("w:top", "964")
		pageMarginTag.setAttribute("w:right", "1077")
		pageMarginTag.setAttribute("w:bottom", "964")
		pageMarginTag.setAttribute("w:left", "1077")

		// Remove the cover page
		let pElements = bodyTag.getElementsByTagName("w:p")
		bodyTag.removeChild(pElements[0])

		// Remove the table of contents
		let elementsToRemove = []

		for (let i = 0; i < pElements.length; i++) {
			let pElement = pElements[i]

			if (pElement.getElementsByTagName("w:bookmarkStart").length == 0) {
				elementsToRemove.push(pElement)
			} else {
				break
			}
		}

		elementsToRemove.forEach(el => bodyTag.removeChild(el))

		// Adapt the size of the title page image
		let titlePagePElement = bodyTag.getElementsByTagName("w:p")[1]
		let titlePageRElement = titlePagePElement.getElementsByTagName("w:r")[0]
		let titlePageDrawingElement = titlePageRElement.getElementsByTagName("w:drawing")[0]
		let titlePageAnchorElement = titlePageDrawingElement.getElementsByTagName("wp:anchor")[0]
		let titlePageExtendElement = titlePageAnchorElement.getElementsByTagName("wp:extent")[0]

		let originalWidth = +titlePageExtendElement.getAttribute("cx")
		let originalHeight = +titlePageExtendElement.getAttribute("cy")

		// Calculate the new height of the title page image
		let newHeight = (originalHeight / originalWidth) * 5040000

		titlePageExtendElement.setAttribute("cx", "5040000")
		titlePageExtendElement.setAttribute("cy", Math.round(newHeight).toString())

		zip.file(documentFileName, serializer.serializeToString(doc))
	}

	async SendDocxFile(zip: JSZip) {
		let docxBlob = await zip.generateAsync({ type: "blob" })
		let anchor = document.createElement("a")
		anchor.href = window.URL.createObjectURL(docxBlob)
		anchor.download = "document.docx"
		anchor.click()
	}
}