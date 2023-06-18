import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Cache } from 'cache-manager';

@Injectable()
export class VatsimService {

  constructor(
    private http: HttpService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  async getDatafeed() {
    // const cachedDatafeedUrl = (await this.cacheManager.get('datafeed_url')) as string;

    // let datafeedUrl: string;
    // if (!cachedDatafeedUrl) {
    //   const statusUrl = this.configService.get<string>('VATSIM_STATUS_URL')

    //   const $urls = this.http.get(statusUrl)

    //   let datafeedUrls = (await firstValueFrom($urls)).data.data.v3;
    //   datafeedUrl = datafeedUrls[Math.random() * (datafeedUrls.length - 1)]

    //   await this.cacheManager.set('datafeed_url', datafeedUrl.toString(), 24 * 60 * 60 * 1000) // Cache for 24 hours
    // } else {
    //   datafeedUrl = cachedDatafeedUrl
    // }

    const cachedDatafeed = (await this.cacheManager.get('datafeed')) as string;

    if (!cachedDatafeed) {
      // const $datafeed = this.http.get(datafeedUrl);
      // let datafeed = (await firstValueFrom($datafeed)).data
      const $datafeed = this.http.get('https://gist.githubusercontent.com/codepip55/eb518cad92ba836a73ccbbcecd3a3af1/raw/31ccbbd36dc2bc11496cbe65a6206c29ef34e7db/datafeed.json');
      let datafeed = (await firstValueFrom($datafeed)).data

      await this.cacheManager.set(
        'datafeed',
        JSON.stringify(datafeed),
        60 * 1000
      ) // Cache for 1 minute
      return { datafeed }
    } else {
      return { datafeed: JSON.parse(cachedDatafeed) }
    }
  }

  async getAllPilots() {
    const data = await this.getDatafeed()
    return data.datafeed['pilots'];
  }

  async getAllControllers() {
    const data = await this.getDatafeed()
    return data.datafeed['controllers'];
  }

  async getPilot(q: { callsign?: string, transponder?: string }) {
    if (!q.callsign && !q.transponder) throw new BadRequestException('Must specify either a callsign or transponder code')

    const pilots = await this.getAllPilots()
    if (q.callsign) {
      let pilot = pilots.filter(a => a.callsign === q.callsign)
      if (!pilot) return { pilot: 'none' }
      return { pilot }
    }

    if (q.transponder) {
      let pilot = pilots.filter(a => {
        if (a.flight_plan) return a.flight_plan.assigned_transponder === q.transponder
          else return false
      })
      if (!pilot) return { pilot: 'none' }
      return { pilot }
    }
  }

  async getControllerByCallsign(callsign: string) {
    if (!callsign) throw new BadRequestException('Must specify a callsign')

    const controllers = await this.getAllControllers()
    let controller = controllers.filter(c => c.callsign === callsign)
    if (!controller) return { controller: 'none' }
    return { controller }
  }

  async getControllerByCid(cid: number) {
    if (!cid) throw new BadRequestException('Must specify a cid')

    const controllers = await this.getAllControllers()
    let controller = controllers.filter(c => c.cid === cid)
    if (!controller) return { controller: 'none' }
    return { controller }
  }
}
