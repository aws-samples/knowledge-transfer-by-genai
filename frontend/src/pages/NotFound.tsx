import React from "react";

const NotFound: React.FC = () => {
  return (
    <div className="flex h-[calc(100vh-49px)] flex-col items-center justify-center">
      <div className="flex text-3xl font-bold">404 ERROR</div>
      <div className="mt-4 text-lg">お探しのページが見つかりませんでした。</div>
    </div>
  );
};

export default NotFound;
