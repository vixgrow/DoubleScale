/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import {
	List,
	Avatar,
	Typography,
	Button,
	Input,
	Spin,
	Empty,
	Popconfirm,
	Space,
	Collapse,
} from 'antd';
import { MessageSquare, Edit, Trash2, User, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * Internal dependencies
 */
import { useActivityOperations } from '../../hooks/use-activity-operations';
import './style.scss';

const { Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

interface ActivityCommentsProps {
	activityId: number;
	activityType: string;
	initialComments?: any[];
}

interface Comment {
	id: number;
	activity_id: number;
	user_id: number;
	content: string;
	formatted_content: string;
	time_ago: string;
	created_at: string;
	updated_at: string;
	user?: {
		id: number;
		display_name: string;
		email: string;
	};
}

export const ActivityComments: React.FC<ActivityCommentsProps> = ({
	activityId,
	activityType,
	initialComments = [],
}) => {
	const [comments, setComments] = useState<Comment[]>(initialComments);
	const [loading, setLoading] = useState(false);
	const [addingComment, setAddingComment] = useState(false);
	const [newComment, setNewComment] = useState('');
	const [editingCommentId, setEditingCommentId] = useState<number | null>(
		null
	);
	const [editingContent, setEditingContent] = useState('');
	const [expanded, setExpanded] = useState(false);

	const { getActivityComments, addComment, updateComment, deleteComment } =
		useActivityOperations();
	const dispatch = useDispatch('quillcrm/core');
	const createNotice = dispatch?.createNotice;

	// Fetch comments if not provided initially
	useEffect(() => {
		if (initialComments.length === 0 && expanded) {
			fetchComments();
		}
	}, [activityId, expanded]);

	const fetchComments = async () => {
		setLoading(true);
		try {
			const response = await getActivityComments(activityId);
			setComments(Array.isArray(response) ? response : []);
		} catch (error) {
			console.error('Failed to fetch comments:', error);
			setComments([]);
		} finally {
			setLoading(false);
		}
	};

	const handleAddComment = async () => {
		if (!newComment.trim()) return;

		setAddingComment(true);
		try {
			const response = await addComment(activityId, newComment.trim());
			setComments((prev) => [...prev, response]);
			setNewComment('');

			if (createNotice) {
				createNotice({
					type: 'success',
					message: __('Comment added successfully!', 'quillcrm'),
				});
			}
		} catch (error) {
			if (createNotice) {
				createNotice({
					type: 'error',
					message:
						error instanceof Error
							? error.message
							: __('Failed to add comment', 'quillcrm'),
				});
			}
		} finally {
			setAddingComment(false);
		}
	};

	const handleEditComment = async (commentId: number) => {
		if (!editingContent.trim()) return;

		try {
			const response = await updateComment(
				commentId,
				editingContent.trim()
			);
			setComments((prev) =>
				prev.map((comment) =>
					comment.id === commentId
						? { ...comment, ...response }
						: comment
				)
			);
			setEditingCommentId(null);
			setEditingContent('');

			if (createNotice) {
				createNotice({
					type: 'success',
					message: __('Comment updated successfully!', 'quillcrm'),
				});
			}
		} catch (error) {
			if (createNotice) {
				createNotice({
					type: 'error',
					message:
						error instanceof Error
							? error.message
							: __('Failed to update comment', 'quillcrm'),
				});
			}
		}
	};

	const handleDeleteComment = async (commentId: number) => {
		try {
			await deleteComment(commentId);
			setComments((prev) =>
				prev.filter((comment) => comment.id !== commentId)
			);

			if (createNotice) {
				createNotice({
					type: 'success',
					message: __('Comment deleted successfully!', 'quillcrm'),
				});
			}
		} catch (error) {
			if (createNotice) {
				createNotice({
					type: 'error',
					message:
						error instanceof Error
							? error.message
							: __('Failed to delete comment', 'quillcrm'),
				});
			}
		}
	};

	const startEditing = (comment: Comment) => {
		setEditingCommentId(comment.id);
		setEditingContent(comment.content);
	};

	const cancelEditing = () => {
		setEditingCommentId(null);
		setEditingContent('');
	};

	const formatCommentTime = (createdAt: string) => {
		return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
	};

	const renderComment = (comment: Comment) => (
		<List.Item key={comment.id} className="activity-comment-item">
			<List.Item.Meta
				avatar={
					<Avatar
						size={32}
						icon={<User size={16} />}
						style={{ backgroundColor: '#1890ff' }}
					>
						{comment.user?.display_name?.charAt(0).toUpperCase()}
					</Avatar>
				}
				title={
					<div className="comment-header">
						<Text strong>
							{comment.user?.display_name ||
								__('Unknown User', 'quillcrm')}
						</Text>
						<Text type="secondary" className="comment-time">
							{formatCommentTime(comment.created_at)}
						</Text>
					</div>
				}
				description={
					<div className="comment-content">
						{editingCommentId === comment.id ? (
							<div className="comment-edit-form">
								<TextArea
									value={editingContent}
									onChange={(e) =>
										setEditingContent(e.target.value)
									}
									rows={2}
									autoFocus
								/>
								<div className="comment-edit-actions">
									<Button
										size="small"
										type="primary"
										onClick={() =>
											handleEditComment(comment.id)
										}
									>
										{__('Save', 'quillcrm')}
									</Button>
									<Button
										size="small"
										onClick={cancelEditing}
									>
										{__('Cancel', 'quillcrm')}
									</Button>
								</div>
							</div>
						) : (
							<div className="comment-display">
								<Text>{comment.content}</Text>
								<div className="comment-actions">
									<Button
										type="text"
										size="small"
										icon={<Edit size={12} />}
										onClick={() => startEditing(comment)}
									>
										{__('Edit', 'quillcrm')}
									</Button>
									<Popconfirm
										title={__(
											'Delete comment?',
											'quillcrm'
										)}
										description={__(
											'Are you sure you want to delete this comment?',
											'quillcrm'
										)}
										onConfirm={() =>
											handleDeleteComment(comment.id)
										}
										okText={__('Yes', 'quillcrm')}
										cancelText={__('No', 'quillcrm')}
									>
										<Button
											type="text"
											size="small"
											icon={<Trash2 size={12} />}
											danger
										>
											{__('Delete', 'quillcrm')}
										</Button>
									</Popconfirm>
								</div>
							</div>
						)}
					</div>
				}
			/>
		</List.Item>
	);

	return (
		<div className="activity-comments">
			<Collapse
				ghost
				onChange={(keys) => setExpanded(keys.includes('comments'))}
			>
				<Panel
					header={
						<div className="comments-header">
							<MessageSquare size={16} />
							<span>
								{comments.length > 0
									? `${comments.length} ${__('comment(s)', 'quillcrm')}`
									: __('Comments', 'quillcrm')}
							</span>
						</div>
					}
					key="comments"
					className="comments-panel"
				>
					<div className="comments-content">
						{/* Add Comment Form */}
						<div className="add-comment-form">
							<TextArea
								value={newComment}
								onChange={(e) => setNewComment(e.target.value)}
								placeholder={__('Add a comment...', 'quillcrm')}
								rows={2}
								maxLength={500}
								showCount
							/>
							<div className="add-comment-actions">
								<Button
									type="primary"
									size="small"
									icon={<Send size={14} />}
									loading={addingComment}
									disabled={!newComment.trim()}
									onClick={handleAddComment}
								>
									{__('Add Comment', 'quillcrm')}
								</Button>
							</div>
						</div>

						{/* Comments List */}
						{loading ? (
							<div className="comments-loading">
								<Spin />
							</div>
						) : comments.length > 0 ? (
							<List
								className="comments-list"
								dataSource={comments}
								renderItem={renderComment}
							/>
						) : (
							<Empty
								description={__('No comments yet', 'quillcrm')}
								image={Empty.PRESENTED_IMAGE_SIMPLE}
								className="comments-empty"
							/>
						)}
					</div>
				</Panel>
			</Collapse>
		</div>
	);
};

