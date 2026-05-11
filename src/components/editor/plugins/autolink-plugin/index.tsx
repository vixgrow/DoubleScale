/**
 *  External dependencies
 */
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';

const URL_MATCHER =
	/((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const MERGE_TAG_PATTERN = /\{\{.*?\}\}/;

export const MATCHERS = [
	(text: string) => {
		if (MERGE_TAG_PATTERN.test(text)) {
			return null;
		}
		const match = URL_MATCHER.exec(text);
		if (match === null) {
			return null;
		}
		const fullMatch = match[0];
		return {
			index: match.index,
			length: fullMatch.length,
			text: fullMatch,
			url: fullMatch.startsWith('http')
				? fullMatch
				: `https://${fullMatch}`,
			attributes: {
				rel: 'noopener noreferrer',
				target: '_blank',
			},
		};
	},
];

export default function AutoLinkMatchers() {
	return <AutoLinkPlugin matchers={MATCHERS} />;
}
