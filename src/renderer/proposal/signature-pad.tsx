/**
 * Canvas signature pad for public proposal acceptance.
 */

import { useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { Button } from '@/components/ui/button';

interface Props {
	onChange: (dataUrl: string) => void;
	disabled?: boolean;
}

export const SignaturePad: React.FC<Props> = ({ onChange, disabled = false }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const drawingRef = useRef(false);

	const syncCanvasSize = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}
		const rect = canvas.getBoundingClientRect();
		const ratio = window.devicePixelRatio || 1;
		canvas.width = Math.max(1, Math.floor(rect.width * ratio));
		canvas.height = Math.max(1, Math.floor(rect.height * ratio));
		const ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.scale(ratio, ratio);
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.lineWidth = 2;
			ctx.strokeStyle = '#0f172a';
		}
	}, []);

	useEffect(() => {
		syncCanvasSize();
		window.addEventListener('resize', syncCanvasSize);
		return () => window.removeEventListener('resize', syncCanvasSize);
	}, [syncCanvasSize]);

	const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return { x: 0, y: 0 };
		}
		const rect = canvas.getBoundingClientRect();
		return {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		};
	};

	const emitSignature = () => {
		const canvas = canvasRef.current;
		if (!canvas) {
			onChange('');
			return;
		}
		onChange(canvas.toDataURL('image/png'));
	};

	const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
		if (disabled) {
			return;
		}
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (!canvas || !ctx) {
			return;
		}
		canvas.setPointerCapture(event.pointerId);
		drawingRef.current = true;
		const { x, y } = getPoint(event);
		ctx.beginPath();
		ctx.moveTo(x, y);
	};

	const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
		if (!drawingRef.current || disabled) {
			return;
		}
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (!canvas || !ctx) {
			return;
		}
		const { x, y } = getPoint(event);
		ctx.lineTo(x, y);
		ctx.stroke();
	};

	const endStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
		if (!drawingRef.current) {
			return;
		}
		drawingRef.current = false;
		const canvas = canvasRef.current;
		if (canvas?.hasPointerCapture(event.pointerId)) {
			canvas.releasePointerCapture(event.pointerId);
		}
		emitSignature();
	};

	const handleClear = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (!canvas || !ctx) {
			return;
		}
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		onChange('');
	};

	return (
		<div className="space-y-2">
			<canvas
				ref={canvasRef}
				className="doublescale-proposal-renderer__signature-canvas"
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={endStroke}
				onPointerLeave={endStroke}
				aria-label={__('Signature', 'doublescale')}
			/>
			<div className="flex justify-end">
				<Button type="button" variant="ghost" size="sm" onClick={handleClear} disabled={disabled}>
					{__('Clear signature', 'doublescale')}
				</Button>
			</div>
		</div>
	);
};
