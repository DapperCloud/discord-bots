#!/bin/bash

cd jojo
./jojobot &> out.log &
cd ..

cd abitbot
./abitbot &> out.log &
cd ..

cd lepers
./lepersbot &> out.log &
cd ..

cd finkeul
./finkeulbot &> out.log &
cd ..
