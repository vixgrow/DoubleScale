/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React, { useState } from 'react';
/**
 * internal dependencies
 */
import {
  CustomDialogHeader,
  GradientGroupIcon,
  Field,
} from '@quillcrm/components';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DeleteGroupDialogProps } from '@quillcrm/client';

export const DeleteGroupDialog: React.FC<DeleteGroupDialogProps> = ({
  visible,
  onClose,
  groupId,
  groups,
  onDelete,
}) => {
  const [newGroupId, setNewGroupId] = useState<number>(groups[0]?.id || 0);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    // Only require newGroupId if there are other groups available
    if (groups.length > 0 && !newGroupId) {
      return;
    }

    setIsDeleting(true);
    
    try {
      // Pass newGroupId only if there are other groups
      const success = await onDelete(
        groupId, 
        groups.length > 0 ? newGroupId : undefined
      );
      
      if (success) {
        setNewGroupId(groups[0]?.id || 0); // Reset to first available group
        onClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            <CustomDialogHeader
              title={__('Delete Group', 'quillcrm')}
              subtitle={
                groups.length > 0
                  ? __('Move fields to another group before deleting.', 'quillcrm')
                  : __('This group will be deleted permanently.', 'quillcrm')
              }
              icon={<GradientGroupIcon />}
            />
          </DialogTitle>
        </DialogHeader>

        <div className="qcrm-fields mt-4 space-y-4">
          {groups.length > 0 && (
            <Field
              label={__('Move fields to', 'quillcrm')}
              value={newGroupId}
              onChange={(value) => setNewGroupId(Number(value))}
              type="select"
              options={groups.map((group) => ({
                label: group.name,
                value: group.id,
              }))}
              required
            />
          )}
        </div>

        <DialogFooter className="mt-6 w-full flex justify-center gap-[10px]">
          <Button
            variant="outline"
            size="xl"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full"
          >
            {__('Cancel', 'quillcrm')}
          </Button>

          <Button
            variant="destructive"
            size="xl"
            onClick={handleDelete}
            disabled={isDeleting || (groups.length > 0 && !newGroupId)}
            className="w-full"
          >
            {isDeleting
              ? __('Deleting...', 'quillcrm')
              : __('Delete', 'quillcrm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};