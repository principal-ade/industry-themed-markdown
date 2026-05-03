/**
 * Inline annotation types.
 *
 * Anchors follow the W3C text-quote selector model: callers identify a
 * span by quoted text plus optional surrounding context, and the renderer
 * resolves it against the live DOM. See:
 * https://www.w3.org/TR/annotation-model/#text-quote-selector
 */

export interface TextQuoteAnchor {
  exact: string;
  prefix?: string;
  suffix?: string;
}

export interface Annotation<TMetadata = unknown> {
  id: string;
  anchor: TextQuoteAnchor;
  metadata?: TMetadata;
  /**
   * Optional count rendered as a small badge in the top-right of the
   * highlight (e.g. number of notes attached to this anchor). Omit, or set
   * to 0, to hide.
   */
  count?: number;
}

export interface ResolvedAnnotation<TMetadata = unknown> extends Annotation<TMetadata> {
  resolved: boolean;
}

export interface AnnotationSelection {
  anchor: TextQuoteAnchor;
  rect: DOMRect;
}
