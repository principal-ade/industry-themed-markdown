import React from 'react';

/**
 * Extract text content from React children
 */
export const extractTextFromChildren = (children: React.ReactNode): string => {
  if (typeof children === 'string') {
    return children;
  }

  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }

  if (React.isValidElement(children)) {
    const props = children.props as { children?: React.ReactNode };
    if (props.children) {
      return extractTextFromChildren(props.children);
    }
  }

  return '';
};

/**
 * Simple link component with loading indicator support
 */
export const LinkWithLoadingIndicator: React.FC<{
  href: string;
  children: React.ReactNode;
  onClick?: (href: string, event?: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}> = ({ href, children, onClick, className, style }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      e.preventDefault();
      onClick(href, e);
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      style={style}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
};
