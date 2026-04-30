import { Module } from '@nestjs/common';
import { ThemeEditorService } from './theme-editor.service';
import { ThemeEditorController } from './theme-editor.controller';
import { ThemesModule } from '../themes/themes.module';
import { PackagesModule } from '../packages/packages.module';

@Module({
    imports: [ThemesModule, PackagesModule],
    providers: [ThemeEditorService],
    controllers: [ThemeEditorController],
    exports: [ThemeEditorService],
})
export class ThemeEditorModule { }
