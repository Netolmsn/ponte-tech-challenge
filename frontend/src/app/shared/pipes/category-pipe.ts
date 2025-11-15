import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'category',
  standalone: true,
})
export class CategoryPipe implements PipeTransform {

  transform(value: string) {
    switch(value){
      case 'front-end' : return 'html';
      case 'back-end' : return 'code';
      case 'Database' : return 'storage';
      case 'DataScience' : return 'genetics';
      case 'Design' : return 'brush';
      case 'QA' : return 'aq';
      case 'DevOps' : return 'cloud_circle';
      case 'Cloud' : return 'cloud';
      case 'Mobile' : return 'mobile';
      case 'Marketing' : return 'ad';
      case 'Security' : return 'security';
      case 'AIML' : return 'airwave';
      case 'Management' : return 'contacts_product';
      case 'Blockchain' : return 'currency_bitcoin';
      case 'Emerging-Tech' : return 'earbud_case';
      case 'Hardware' : return 'computer';
      case 'GameDev' : return 'gamepad';
      case 'ComputerScience' : return 'monitor_weight';
    }
    return 'code';
  }

}
