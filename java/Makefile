JAVAC = javac
JAVA = java
SRC_DIR = src/com/smartgrid
BIN_DIR = bin

SOURCES = $(wildcard $(SRC_DIR)/*.java)
CLASSES = $(patsubst $(SRC_DIR)/%.java, $(BIN_DIR)/com/smartgrid/%.class, $(SOURCES))

all: $(CLASSES)

$(BIN_DIR)/com/smartgrid/%.class: $(SRC_DIR)/%.java
	@mkdir -p $(BIN_DIR)
	$(JAVAC) -d $(BIN_DIR) $(SOURCES)

run: all
	$(JAVA) -cp $(BIN_DIR) com.smartgrid.SimulationRunner ../data/historical_loads.csv ../data/forecast_loads.csv ../data/transfer_recommendations.csv

clean:
	rm -rf $(BIN_DIR)

.PHONY: all run clean
