import type { IAdapter } from '../../interfaces'
import JsonExport from './Export'
import Typecast from '../../Typecast'

/**
 * JSON format version 1 exporter.
 *
 * Exports feature flag state from an adapter to JSON format version 1.
 * Compatible with Ruby Flipper's JSON V1 export format.
 *
 * @example
 * const adapter = new MemoryAdapter();
 * const exporter = new V1();
 * const exportObj = exporter.call(adapter);
 *
 * // Export structure:
 * // {
 * //   "version": 1,
 * //   "features": {
 * //     "search": {
 * //       "boolean": "true",
 * //       "actors": ["User;1", "User;2"],
 * //       "groups": ["admins"],
 * //       "percentage_of_actors": "25",
 * //       "percentage_of_time": "50",
 * //       "expression": null
 * //     }
 * //   }
 * // }
 */
class V1 {
  /**
   * The export format version.
   */
  public static readonly VERSION = 1

  /**
   * Export an adapter's features to JSON format version 1.
   *
   * @param adapter - The adapter to export from
   * @returns JSON Export object
   */
  public async call(adapter: IAdapter): Promise<JsonExport> {
    const features = await adapter.getAll()

    // Convert Sets to Arrays for JSON serialization
    Object.keys(features).forEach((featureKey) => {
      const gates = features[featureKey]
      if (!gates) {
        return
      }

      Object.keys(gates).forEach((gateKey) => {
        const value = gates[gateKey]
        if (value instanceof Set) {
          gates[gateKey] = Array.from(value)
        }
      })
    })

    const json = Typecast.toJson({
      version: V1.VERSION,
      features,
    })

    return new JsonExport({
      contents: json,
      version: V1.VERSION,
    })
  }
}

export default V1
