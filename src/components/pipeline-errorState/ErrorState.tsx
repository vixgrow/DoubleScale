import React from 'react';
import { Button } from '@/components/ui/button';
import ServerErrorIcon from '@doublescale/shared/icons/server-error';
import NotFoundIcon from '@doublescale/shared/icons/notFound-page';
import NotAuthorizedIcon from '@doublescale/shared/icons/not-authorizated';
import NoInternetIcon from '@doublescale/shared/icons/no-internet';

interface ErrorStateProps {
  type: number; // 404, 403, 0, 500 ...
  onRetry?: () => void; // function retry أو reload
}

export const ErrorState: React.FC<ErrorStateProps> = ({ type, onRetry }) => {
  // حدد الصورة و action الزرار حسب نوع الخطأ
  let image: React.ReactNode = null;
  let buttonLabel = '';
  let buttonAction: (() => void) | undefined = onRetry;

  switch (type) {
    case 404:
      image = (
       <NotFoundIcon/>
      );
      buttonLabel = 'Go to HomePage';
      buttonAction = () => (window.location.href = '/pipelines');
      break;
    case 403:
      image = (
        <NotAuthorizedIcon/>
      );
      buttonLabel = 'Refresh This Page';
      buttonAction = () => window.location.reload();
      break;
    case 0: // Network error
      image = (
        <NoInternetIcon/>
      );
      buttonLabel = 'Refresh This Page';
      buttonAction = () => window.location.reload();
      break;
    default: 
      image = (
        <ServerErrorIcon/>
      );
      buttonLabel = 'Try Again';
      buttonAction = onRetry;
      break;
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      {image}
      <Button
        onClick={buttonAction}
        className="mt-4 bg-[#1E3A8A] hover:bg-[#1E3A8A] py-2 px-4 rounded-[8px] text-[#FFF] font-medium text-base"
      >
        {buttonLabel}
      </Button>
    </div>
  );
};
