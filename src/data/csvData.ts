// CSV 파일들을 문자열로 직접 import
import kpiLibraryCSV from '../../S1_All_KPI_Package/S1_All_KPI_Library_UTF8.csv?raw';
import stageRulesCSV from '../../S1_All_KPI_Package/S1_All_KPI_StageRules_UTF8.csv?raw';
import inputsCSV from '../../S1_All_KPI_Package/S1_All_KPI_Inputs_UTF8.csv?raw';

export const csvData = {
  library: kpiLibraryCSV,
  stageRules: stageRulesCSV,
  inputs: inputsCSV
};