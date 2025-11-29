
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import ContactAddIcon from '@quillcrm/components/icons/contact-add';
import { CustomDialogHeader } from '@quillcrm/components';
import { useState } from 'react';
import { NoticeMessage } from '@/client/types';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

// Mock Icons (replace with your actual icons)


export function AddContactDialog({ open, onClose, onSubmit}) {
  // const [notice, setNotice] = useState<NoticeMessage | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: { firstName: '', lastName: '', email: '' },
  });

  const handleFormSubmit = (data) => {
    onSubmit?.(data);
    
    onClose();
    reset();
  };

  const handleCancel = () => {
    onClose();
    reset();
  };
  

  const onFormSubmit = handleSubmit(handleFormSubmit);

  return (
    <Dialog open={open} onOpenChange={(value) => !value && handleCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle asChild>
            <CustomDialogHeader
              title="Add Contact"
              subtitle="Add basic information below to add new Contact"
              icon={<span className=' text-[#1E3A8A]'><ContactAddIcon width={22} height={22} /></span>}
            />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className=' text-base leading-6'>First Name<span  className=' text-[#EF4444]'>*</span></Label>
            <Input
              id="firstName"
              placeholder="Lowarooo"
              {...register('firstName', {
                required: 'First name is required',
              })}
              className='border border-[#DEE1E6] h-12 py-[5px] px-4 shadow-none rounded-[8px]'
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className=' text-base leading-6'>Last Name<span  className=' text-[#EF4444]'>*</span></Label>
            <Input
              id="lastName"
              placeholder="David"
              {...register('lastName', {
                required: 'Last name is required',
              })}
              className='border border-[#DEE1E6] h-12 py-[5px] px-4 shadow-none rounded-[8px]'
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs">{errors.lastName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className=' text-base leading-6'>Email<span  className=' text-[#EF4444]'>*</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="LowaroooDavig@gmail.com"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
             className='border-0 h-12 py-[5px] px-4 shadow-none rounded-[8px]'
            />
            {errors.email && (
              <p className="text-red-500 text-xs">{errors.email.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
          <Button
  onClick={onFormSubmit}
  variant="ghost"
  className="h-12 p-[10px] text-white"
  style={{
    background: "linear-gradient(90deg, #1E3A8A 61.06%, #3B82F6 100%)",
  }}
>
  Submit
</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
