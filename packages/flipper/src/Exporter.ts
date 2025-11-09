import V1 from './exporters/json/V1'
import type Export from './Export'
import type { IAdapter } from './interfaces'

/**
 * Interface for exporters that convert adapter data to export format.
 */
export interface IExporter {
  /**
   * Export an adapter's features.
   * @param adapter - The adapter to export from
   * @returns Export object
   */
  call: (adapter: IAdapter) => Promise<Export>
}

/**
 * Factory for building exporters based on format and version.
 *
 * @example
 * const exporter = Exporter.build({ format: 'json', version: 1 });
 * const exportObj = await exporter.call(adapter);
 */
class Exporter {
  /**
   * Map of available exporters by format and version.
   */
  private static readonly FORMATTERS: Record<string, Record<number, new () => IExporter>> = {
    json: {
      1: V1,
    },
  }

  /**
   * Build an exporter for the specified format and version.
   *
   * @param options - Exporter options
   * @returns Exporter instance
   * @throws {Error} If format or version is not supported
   */
  public static build(options: { format?: string; version?: number } = {}): IExporter {
    const format = options.format ?? 'json'
    const version = options.version ?? 1

    const formatters = this.FORMATTERS[format]
    if (!formatters) {
      throw new Error(`Unsupported export format: ${format}`)
    }

    const ExporterClass = formatters[version]
    if (!ExporterClass) {
      throw new Error(`Unsupported ${format} export version: ${version}`)
    }

    return new ExporterClass()
  }
}

export default Exporter
