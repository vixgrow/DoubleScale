/**
 * internal dependencies
 */
import './style.scss';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ExportProvider } from './contexts';
import ExportHeader from './export-header';
import ExportContent from './export-content';

export interface Props {
	open: boolean;
	onClose: () => void;
}

const ExportModal: React.FC<Props> = ({ open, onClose }) => {
	return (
		<ExportProvider open={open} onClose={onClose}>
			<Dialog
				open={open}
				onOpenChange={(value) => {
					if (!value) {
						onClose();
					}
				}}
			>
				<DialogContent className="z-[150000] w-screen h-screen max-w-none gap-8 overflow-y-auto py-4 px-16 bg-white rounded-none shadow-none">
					<ExportHeader />
					<div className="flex h-full gap-5">
						<div className="w-full">
							<Card className="shadow-none rounded-2xl border-none bg-[#FAFAFA]">
								<CardContent className="py-4 px-24">
									<ExportContent />
								</CardContent>
							</Card>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</ExportProvider>
	);
};

export default ExportModal;
