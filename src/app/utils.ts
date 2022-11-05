import axios from 'axios'
import { defaultAuthorNameFontSize } from './constants'

export function CalculateFontSizeRelativeToHeight(originalFontSize: number, resultHeight: number): number {
	return Math.ceil((originalFontSize / 2100) * resultHeight)
}

export function GetDefaultAuthorNameFontSize(height: number): number {
	return CalculateFontSizeRelativeToHeight(defaultAuthorNameFontSize, height)
}

export async function GetCoverDimensions(): Promise<{
	rueckenbreite: number,
	beschnitt: number,
	ulbreite_o: number,
	ulbreite_m: number,
	gbreite_o: number,
	gbreite_m: number,
	hoehe_o: number,
	hoehe_m: number,
	dicke: number,
	su_max_gbreite_m: number
}> {
	try {
		let response = await axios({
			method: 'post',
			url: 'https://www.bod.de/fileadmin/bod/php/include/utils.ajax.php',
			params: new URLSearchParams({
				MODE: 'bp_checkcover',
				einbandart: 'PB',
				buchformat: '12*19',
				anzseiten: '342',
				papierfarbe: 'weiss80'
			})
		})

		return {
			rueckenbreite: Number.parseFloat(response.data.rueckenbreite),
			beschnitt: Number.parseFloat(response.data.beschnitt),
			ulbreite_o: Number.parseFloat(response.data.ulbreite_o),
			ulbreite_m: Number.parseFloat(response.data.ulbreite_m),
			gbreite_o: Number.parseFloat(response.data.gbreite_o),
			gbreite_m: Number.parseFloat(response.data.gbreite_m),
			hoehe_o: Number.parseFloat(response.data.hoehe_o),
			hoehe_m: Number.parseFloat(response.data.hoehe_m),
			dicke: Number.parseFloat(response.data.dicke),
			su_max_gbreite_m: response.data.su_max_gbreite_m
		}
	} catch (error) {
		return {
			rueckenbreite: 0,
			beschnitt: 0,
			ulbreite_o: 0,
			ulbreite_m: 0,
			gbreite_o: 0,
			gbreite_m: 0,
			hoehe_o: 0,
			hoehe_m: 0,
			dicke: 0,
			su_max_gbreite_m: 0
		}
	}
}