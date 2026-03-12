import { toBlob } from "html-to-image";

export async function captureElement(element: HTMLElement): Promise<Blob> {
	const blob = await toBlob(element, {
		backgroundColor: getComputedStyle(element).backgroundColor || "#ffffff",
		pixelRatio: 2,
	});
	if (!blob) {
		throw new Error("Failed to capture element as image");
	}
	return blob;
}

export async function copyToClipboard(blob: Blob): Promise<boolean> {
	try {
		await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
		return true;
	} catch {
		// Safari fallback: ClipboardItem may need a Promise
		try {
			await navigator.clipboard.write([
				new ClipboardItem({
					[blob.type]: Promise.resolve(blob),
				}),
			]);
			return true;
		} catch {
			return false;
		}
	}
}

export function downloadAsImage(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export function shareToX(text: string) {
	const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
	window.open(url, "_blank", "noopener,noreferrer");
}
