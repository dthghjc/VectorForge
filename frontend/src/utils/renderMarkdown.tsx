import { Typography } from 'antd';
import markdownit from 'markdown-it';
import type { BubbleProps } from '@ant-design/x';

const md = markdownit({ html: true, breaks: true });

export const renderMarkdown: BubbleProps['messageRender'] = (content) => {
  return (
    <Typography>
      <div
        dangerouslySetInnerHTML={{ __html: md.render(content) }}
      />
    </Typography>
  );
};
