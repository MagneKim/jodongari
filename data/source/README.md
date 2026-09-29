# Source data

원본 XLSX(`national_species_list_20241231.xlsx`)는 license 조건(공공저작물 제3유형, 변경금지)과
파일 크기(약 22MB) 때문에 repo에 포함하지 않고 `.gitignore` 처리한다.

`data/birds.json`을 다시 생성하려면:

1. 아래 파일을 이 폴더에 `national_species_list_20241231.xlsx`로 저장
   - 데이터셋: 기후에너지환경부 국립생물자원관_국가생물종목록_20241231 (2025년 국가생물종목록_v1.0.xlsx)
   - 출처: https://www.data.go.kr/data/15048041/fileData.do
   - 원문 다운로드: https://www.kbr.go.kr/content/view.do?menuKey=799&contentKey=174
2. `node scripts/import-birds.mjs` 실행

자세한 dataset metadata는 `data/bird-dataset-meta.json` 참고.
