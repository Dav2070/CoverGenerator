import { defaultAuthorNameFontSize } from './constants'

export function CalculateFontSizeRelativeToHeight(originalFontSize: number, resultHeight: number): number {
	return Math.ceil((originalFontSize / 2100) * resultHeight)
}

export function GetDefaultAuthorNameFontSize(height: number): number {
	return CalculateFontSizeRelativeToHeight(defaultAuthorNameFontSize, height)
}