import { CollectedArticle } from '../../types';

export interface ArticleWithSerial extends CollectedArticle {
    serial: number;
}

export interface HourGroup {
    label: string;
    items: ArticleWithSerial[];
    sortTime: number; 
}

export interface DateGroup {
    label: string;
    hours: HourGroup[];
}
