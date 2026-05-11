const PanelSettingsHeader: React.FC<{
	title: string;
	description: string;
	icon: React.ReactNode;
	iconVariant?: 'default' | 'white';
}> = ({ title, description, icon }) => {
	return (
		<div className="flex items-center gap-4 rounded-t-2xl border border-b-0 border-border/70 bg-gradient-to-r from-muted/40 via-background to-background px-8 py-5">
			<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card shadow-sm text-foreground">
				{icon}
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-base font-semibold tracking-tight text-foreground">
					{title}
				</p>
				<p className="mt-0.5 text-sm leading-snug text-muted-foreground">
					{description}
				</p>
			</div>
		</div>
	);
};

export default PanelSettingsHeader;
