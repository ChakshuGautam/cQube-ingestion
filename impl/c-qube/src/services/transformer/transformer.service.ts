import { Injectable } from '@nestjs/common';
import { TransformAsync, TransformSync } from 'src/types/transformer';
import { Transformer } from 'src/types/transformer';
import { PrismaService } from '../../prisma.service';
import {
  EventGrammar as EventGrammarModel,
  Transformer as TransformerModel,
  DatasetGrammar as DatasetGrammarModel,
} from '@prisma/client';

@Injectable()
export class TransformerService {
  constructor(public prisma: PrismaService) {}
  // Crude implementation of AKKA actor
  stringToTransformAsync = (transformAsync: string): TransformAsync => {
    return (callback, context, event) => {
      // event will be processed by eval
      return new Promise((resolve, reject) => {
        try {
          const result = eval(transformAsync);
          callback(null, context, result);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    };
  };

  stringToTransformSync = (transformSync: string): TransformSync => {
    return (callback, context, event) => {
      try {
        const result = eval(transformSync);
        callback(null, context, result);
        return result;
      } catch (error) {
        throw error;
      }
    };
  };

  async persistTransormer(transformer: Transformer): Promise<TransformerModel> {
    // const eventGrammar: EventGrammarModel =
    //   await this.prisma.eventGrammar.findUnique({
    //     where: { name: transformer },
    //   });
    // const datasetGrammar: DatasetGrammarModel =
    //   await this.prisma.datasetGrammar.findUnique({
    //     where: { name: transformer.event.name },
    //   });
    return this.prisma.transformer.create({
      data: {
        name: transformer.name,
        transformAsync: transformer.transformAsync
          ? transformer.transformAsync.toString()
          : null,
        transformSync: transformer.transformSync
          ? transformer.transformSync.toString()
          : null,
      },
    });
  }
}
