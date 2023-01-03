import { Component } from '@angular/core'
import axios from 'axios'
import * as JSZip from 'jszip'
import { PromiseHolder } from 'dav-js'
import { convertioApiKey } from '../../environments/secrets'

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

		await this.AdaptPageSize(zip, parser, serializer)

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

	async AdaptPageSize(zip: JSZip, parser: DOMParser, serializer: XMLSerializer) {
		let content = await zip.file("word/document.xml").async("string")
		let doc = parser.parseFromString(content, "text/xml")

		let documentTag = doc.getElementsByTagName("w:document")[0]
		let bodyTag = documentTag.getElementsByTagName("w:body")[0]
		let sectionTag = bodyTag.getElementsByTagName("w:sectPr")[0]
		let pageSizeTag = sectionTag.getElementsByTagName("w:pgSz")[0]
		pageSizeTag.setAttribute("w:w", "7938")
		pageSizeTag.setAttribute("w:h", "12247")

		zip.file("word/document.xml", serializer.serializeToString(doc))
	}

	async SendDocxFile(zip: JSZip) {
		let docxBlob = await zip.generateAsync({ type: "blob" })
		let anchor = document.createElement("a")
		anchor.href = window.URL.createObjectURL(docxBlob)
		anchor.download = "document.docx"
		anchor.click()
	}
}