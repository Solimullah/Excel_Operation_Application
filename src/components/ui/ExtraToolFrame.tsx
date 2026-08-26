import React from 'react';

interface ExtraToolFrameProps {
  src: string;
  title: string;
}

export const ExtraToolFrame: React.FC<ExtraToolFrameProps> = ({ src, title }) => {
  return (
    <div className="w-full h-[calc(100vh-13rem)] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-white">
      <iframe
        src={src}
        title={title}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-downloads allow-forms allow-modals allow-popups allow-same-origin"
      />
    </div>
  );
};
