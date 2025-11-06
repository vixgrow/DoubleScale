

import { useState, useEffect } from '@wordpress/element';
import { differenceInDays, format, formatDistanceToNow } from 'date-fns';
import { Button } from '@quillcrm/components/ui/button';
import { Textarea } from '@quillcrm/components/ui/textarea';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@quillcrm/components/ui/accordion';
import { useActivityOperations } from '../../hooks/use-activity-operations';
import { Label } from '@quillcrm/components/ui/label';
import { __ } from '@wordpress/i18n';
import CommentIcon from '@quillcrm/components/icons/comment';
import MeetingActivityIcon from '@quillcrm/components/icons/meeting-activity';
import UserActivityIcon from '@quillcrm/components/icons/user-activity';
import TrashIcon from '@quillcrm/components/icons/trash';
import EditHeaderIcon from '@quillcrm/components/icons/edit-header';
import { useDispatch } from '@wordpress/data';


interface ActivityCommentsProps {
  activityId: number;
  initialComments?: any[];
}

interface Comment {
  id: number;
  activity_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user?: {
    id: number;
    display_name: string;
    email: string;
  };
}

export const ActivityComments: React.FC<ActivityCommentsProps> = ({
  activityId,
  initialComments = [],
}) => {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const { getActivityComments, addComment, updateComment, deleteComment } = useActivityOperations();
  const dispatch = useDispatch('quillcrm/core');
  const createNotice = dispatch?.createNotice;

  useEffect(() => {
    if (initialComments.length === 0) return;
    if (expanded && comments.length === 0) fetchComments();
  }, [expanded]);

  const fetchComments = async () => {
    try {
      const response = await getActivityComments(activityId);
      setComments(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setAddingComment(true);
    try {
      const response = await addComment(activityId, newComment.trim());
      setComments((prev) => [...prev, response]);
      setNewComment('');
	  createNotice?.({
		type: 'success',
		message: __(
			`Comment Added successfully!`,
			'quillcrm'
		),
	});
    } catch (error) {
	  const err = error as Error;
	  createNotice?.({
		type: 'error',
		message: err.message || __('Failed to add comment', 'quillcrm'),
	  })
    } finally {
      setAddingComment(false);
    }
  };
  const formatActivityTime = (createdAt: string) => {
	const date = new Date(createdAt);
	const now = new Date();
	const diffDays = differenceInDays(now, date);

	if (diffDays === 0) {
		return format(date, 'h:mm a');
	} else if (diffDays < 7) {
		return `Last ${format(date, "EEEE 'at' h:mm a")}`;
	} else {
		return format(date, "MMM d, yyyy 'at' h:mm a");
	}
};

  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      if (editingCommentId === commentId) cancelEditing();
	  createNotice?.({
		type: 'success',
		message: __(
			`Comment deleted successfully!`,
			'quillcrm'
		),
		
	});

    } catch (error) {
	  const err = error as Error;
	  createNotice?.({
		type: 'error',
		message: err.message || __('Failed to delete comment', 'quillcrm'),
	  })
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

  const handleEditComment = async (commentId: number) => {
    if (!editingContent.trim()) return;
    try {
      const response = await updateComment(commentId, editingContent.trim());
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, ...response } : c))
      );
      cancelEditing();
	  createNotice?.({
		type: 'success',
		message: __(
			`Comment edited successfully!`,
			'quillcrm'
		),
	});
    } catch (error) {
	  const err = error as Error;
	  createNotice?.({
		type: 'error',
		message: err.message || __('Failed to edit comment', 'quillcrm'),
	  })
    }
  };

  const renderNewCommentForm = () => (
    <div className="flex flex-col gap-2 mt-2">
	 <Label className='text-[#2E2C2F] text-base font-normal'>
	 {__('Comment','quillcrm')}
	 <span className=' text-[#E13B3B] text-base font-normal'>*</span>
	 </Label>
      <Textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Type here your comment..."
        rows={3}
      />
      <div className="flex justify-end gap-2">
        <Button onClick={() => setNewComment('')} variant="outline">
		  {__('Cancel','quillcrm')}
        </Button>
        <Button onClick={handleAddComment} disabled={!newComment.trim() || addingComment}>
		  {__('Add Comment','quillcrm')}
        </Button>
      </div>
    </div>
  );

  const renderCommentsList = () => (
	<div className="flex flex-col gap-3 mt-2 ml-2">
	  {comments.length > 0 ? (
		<div className="relative">
		 
		  <div className="absolute left-[18px] top-0 bottom-0 w-[2px] bg-dashed border-l-2 border-[#E5E7EB] border-dashed"></div>
  
		 <div className='space-y-0'>
		 {comments.map((comment,index) => {
			const initials = comment.user?.display_name
			? comment.user.display_name
				.split(' ')
				.map((n) => n.charAt(0))
				.join('')
				.toUpperCase()
			: 'U';
			return(
				<div key={comment.id} className="p-2 flex flex-col gap-2 relative pl-12 pb-8">
				
				<div className="absolute p-1 text-[#09090B] text-lg font-semibold left-0 top-0 w-9 h-9 rounded-full bg-[#FFF] flex items-center justify-center  border border-[#DEE1E6]">
					{initials}		
				</div>
				<div className='flex justify-between'>
				<div className="flex  gap-2">
			  <div className=" flex justify-center gap-2">
				<MeetingActivityIcon />
				<p className="text-base font-normal text-[#777] border-r border-r-[#DEE1E6] pr-2">
					{formatActivityTime(comment.created_at	)}
				</p>
			  </div>
			  <div className="flex justify-center gap-2">
				<UserActivityIcon />
				<p className="text-base font-normal text-[#777]">
				   {comment.user?.display_name ||__('System','quillcrm')}</p>
			  </div>
			  </div>

				<div className="flex gap-2">
				  {editingCommentId !== comment.id && (
					<Button variant={"ghost"} size="icon" onClick={() => startEditing(comment)} className='!bg-none !border-none focus:bg-none hover:bg-none' >
					  <EditHeaderIcon/>
					</Button>
				  )}
				  <Button variant={"ghost"}  size="icon" onClick={() => handleDeleteComment(comment.id)} className='!bg-none !border-none focus:bg-none hover:bg-none'>
					<TrashIcon/>
				  </Button>
				</div>
			    </div>

			  
  
			  {editingCommentId === comment.id ? (
				<div className="flex flex-col gap-2 mt-2 ">
				  <Textarea
					value={editingContent}
					onChange={(e) => setEditingContent(e.target.value)}
					rows={2}
					autoFocus
				  />
				  <div className="flex justify-end gap-2">
					<Button onClick={() => handleEditComment(comment.id)}>Save</Button>
					<Button variant="outline" onClick={cancelEditing}>Cancel</Button>
				  </div>
				</div>
			  ) : (
				<p className="mt-1">{comment.content}</p>
			  )}
			</div>

			)
			
			
})}
		 </div>
		</div>
	  ) : (
		<p className="text-gray-400 text-center">No comments yet</p>
	  )}
	</div>
  );
  

  

  return (
    <div className="w-full bg-[#FFF] rounded-[16px] p-4 mt-5">
		{renderNewCommentForm()}
      {comments.length > 0 ? (
        <Accordion type="single" collapsible className="w-full mt-4">
          <AccordionItem value="comments" className="border rounded-[8px] ">
            <AccordionTrigger className='flex py-3 px-4 w-full bg-[#DEE1E680] h-12 rounded-t-[8px] cursor-pointer' onClick={() => setExpanded(!expanded)}>
			 
              
			  <span className="flex items-center gap-2">
			    <CommentIcon/>
                <span className="text-lg font-medium text-[#09090B]">
				{__('All Comments','quillcrm')} ({comments.length})
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {renderCommentsList()}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        ''
      )}
    </div>
  );
};

