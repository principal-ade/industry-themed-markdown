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
 * An "external" link leaves the app to the browser: an absolute web URL
 * (`http://`, `https://`, protocol-relative `//host`) or a `mailto:`. Everything
 * else — bare/`./`/`../` repo-relative paths, repo-root `/...`, and custom
 * resolver schemes like `symbol://` — is internal and routed through the host.
 * External links keep the underline; internal links get the pill treatment.
 */
export const isExternalLink = (href: string): boolean =>
  /^(https?:)?\/\//i.test(href) || /^mailto:/i.test(href);

/**
 * Simple link component with loading indicator support
 */
export const LinkWithLoadingIndicator: React.FC<{
  href: string;
  children: React.ReactNode;
  onClick?: (href: string, event?: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  className?: string;
  style?: React.CSSProperties;
}> = ({
  href,
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  className,
  style,
}) => {
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
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      className={className}
      style={style}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
};
