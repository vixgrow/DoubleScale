import { __, _n, sprintf } from '@wordpress/i18n';

interface WordCountPluginProps {
	wordCount: number;
}

const WordCountPlugin: React.FC<WordCountPluginProps> = ({ wordCount }) => {
	return (
		<div>
			{sprintf(
				/* translators: %d: word count */
				_n('%d word', '%d words', wordCount, 'doublescale'),
				wordCount
			)}
		</div>
	);
};

export default WordCountPlugin;
