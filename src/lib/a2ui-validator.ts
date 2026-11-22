import {
  MessageProcessor,
  STRICT_VALIDATION,
  type AgentToRendererMessage,
  type RendererErrorMessage,
} from '@a2ui/web_core/v1_0';
import { basicCatalog } from '@a2ui/web_core/catalogs/basic/v1';

export interface A2uiValidationReport {
  valid: boolean;
  errors: RendererErrorMessage[];
  surfaceIds: string[];
  capabilities: ReturnType<MessageProcessor['getRendererCapabilities']>;
}

/**
 * Validates an array of A2UI v1.0 messages against Google's official `@a2ui/web_core`
 * `MessageProcessor` with `STRICT_VALIDATION` and the v1.0 Basic Catalog.
 */
export function validateA2uiV10Messages(
  messages: readonly AgentToRendererMessage[],
): A2uiValidationReport {
  const processor = new MessageProcessor([basicCatalog], undefined, {
    version: '1.0',
    validationConfig: STRICT_VALIDATION,
  });

  try {
    const errors = processor.processMessagesWithErrors(messages);
    const surfaceIds = Array.from(processor.getSurfaces().keys());
    const capabilities = processor.getRendererCapabilities({ versions: ['1.0'] });
    return {
      valid: errors.length === 0 && surfaceIds.length > 0,
      errors,
      surfaceIds,
      capabilities,
    };
  } finally {
    processor.dispose();
  }
}
