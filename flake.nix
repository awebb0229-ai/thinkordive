{
  description = "A full-stack stock trading simulation platform where users can buy and sell stocks in a realistic market environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = inputs.nixpkgs.lib.systems.flakeExposed;

      perSystem =
        { pkgs, ... }:
        {
          devShells.default = pkgs.mkShell {
            name = "thinkorswim-dev";

            packages = with pkgs; [
              bun
              process-compose
            ];
          };
        };
    };
}
